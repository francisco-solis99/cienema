import { getTranslation } from './lang.js';
import {
  getListResults,
  loadDefaultImage,
  scrollToLeft,
  scrollToRight,
  getItemFromLocalStorage,
  setItemFromLocalStorage,
  getNestedProperty,
  getColorCategoryCssVariableByName
} from './utils.js';

// Intersection observer
const intersectionCallback = (entries) => {
  entries.forEach((entry) => {
    const targetElement = entry.target;
    if (entry.isIntersecting) {
      // Set url imae to the movie card and unobserve the element
      targetElement.src = targetElement.dataset.img;
      observerCardMovie.unobserve(targetElement);
    }
  });
};
const observerCardMovie = new IntersectionObserver(intersectionCallback);

// Render the most tendencie movie
export async function renderBestTrendingMovie() {
  const header = document.querySelector('.header');
  const data = await getListResults('trendingMovies');
  const { results } = data;
  const [bestTrendingMovie] = results;
  header.style.backgroundImage = `linear-gradient(to bottom, rgba(45, 41, 64, 0.45), rgba(13, 23, 53, 1)), url('https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces${bestTrendingMovie.backdrop_path}')`;
  const movieTitle = header.querySelector('.header h2');
  movieTitle.textContent = bestTrendingMovie.title;
  movieTitle.classList.add('best__movie-title');
  movieTitle.classList.remove('skeleton-text');
  movieTitle.classList.remove('skeleton');
}

// Render the list results
export async function renderListResults({ htmlSelectorSection, urlInfo, callbackRender, numItems, toClean = true }) {
  const data = await getListResults(urlInfo);
  const section = document.querySelector(htmlSelectorSection);
  const fragment = document.createDocumentFragment();
  const list = getNestedProperty({ obj: data, propertyPath: urlInfo.propertyPath }) ?? [];

  list.slice(0, numItems ?? list.lenght).forEach((item) => {
    const element = callbackRender(item);
    fragment.append(element);
  });

  if (toClean) {
    section.innerHTML = '';
  }
  section.appendChild(fragment);
  return data;
}

// Render a message to announce the last load of the items
export function renderNoMoreResults({ htmlSelectorSection }) {
  const section = document.querySelector(htmlSelectorSection);

  const divNoMore = document.createElement('div');
  divNoMore.classList.add('no-more__movies');
  divNoMore.innerHTML = `
    <p>Is the end of the list, search for more movies or wait when we add more...</p>
  `;
  section.appendChild(divNoMore);
}

// Create a movie card with some of the movie information
export function createMovieCard({ movie, lazy = false, isLiked = false }) {
  const { poster_path: posterPath, title: movieName, release_date: date, vote_average: score, id } = movie;
  const posterUrl = `https://www.themoviedb.org/t/p/w300/${posterPath}`;
  const card = document.createElement('arcticle');
  card.classList.add('movie__card');
  card.innerHTML = /* html */`
    <figure class="card__poster-wrapper">
      <img src="${lazy ? '' : posterUrl}" data-img="${lazy ? posterUrl : ''}" alt="Poster - ${movieName}" class="skeleton card__poster">
      <figcaption class="card__caption">
        <h3 class="card__movie-title">${movieName}</h4>
        <span>
          <svg width="15" height="15" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24.192 8.45108L16.6975 7.35612L13.3472 0.528203C13.2557 0.341259 13.1052 0.189923 12.9192 0.0979342C12.4528 -0.133521 11.8861 0.0593584 11.6529 0.528203L8.30266 7.35612L0.808145 8.45108C0.601522 8.48076 0.41261 8.57868 0.267974 8.72705C0.0931164 8.90772 -0.00323781 9.15079 8.308e-05 9.40284C0.00340397 9.6549 0.106128 9.89531 0.285684 10.0713L5.70806 15.3858L4.427 22.8903C4.39696 23.0649 4.41618 23.2444 4.48247 23.4086C4.54877 23.5727 4.65949 23.7149 4.80208 23.819C4.94467 23.9231 5.11342 23.985 5.28921 23.9976C5.46499 24.0102 5.64077 23.973 5.79662 23.8903L12.5001 20.3473L19.2035 23.8903C19.3865 23.9882 19.599 24.0209 19.8027 23.9853C20.3163 23.8962 20.6617 23.4066 20.5731 22.8903L19.2921 15.3858L24.7144 10.0713C24.862 9.92587 24.9594 9.73595 24.9889 9.52824C25.0686 9.00895 24.7085 8.52823 24.192 8.45108V8.45108Z" fill="#FFB608"/>
          </svg>
        </span>
        <span>${Math.round(score)}</span>
        <span>|</span>
        <span>${date}</span>
      </figcaption>
    </figure>
  `;

  const buttonLike = document.createElement('button');
  buttonLike.classList.add('card__btn-like');
  const heart = isLiked ? '❤️' : '🤍';

  buttonLike.innerHTML = `<span class="card__heart">${heart}</span>`;
  card.appendChild(buttonLike);

  // Add the like function
  buttonLike.addEventListener('click', (e) => {
    e.stopPropagation();
    const likeElement = buttonLike.querySelector('span');
    likeElement.textContent = !isLiked ? '❤️' : '🤍';
    handleLikedMovies(movie, isLiked);
  });

  const movieImg = card.querySelector('img');
  if (lazy) {
    observerCardMovie.observe(movieImg);
  }

  // Listener to default image on error loading case
  movieImg.addEventListener('error', (e) => {
    movieImg.classList.add('unload');
    loadDefaultImage(e, 'imgMovie');
  });

  // Listener to change the view to the movie detail view
  card.addEventListener('click', () => {
    location.hash = `#movie=${id}`;
  });

  return card;
}

function handleLikedMovies(movie, isLiked) {
  const likedMovies = getItemFromLocalStorage('cinema-liked');
  if (isLiked) {
    delete likedMovies[movie.id];
  } else {
    likedMovies[movie.id] = movie;
  }
  setItemFromLocalStorage('cinema-liked', likedMovies);
  renderLikedMovies({ htmlSelectorSection: '.section__liked .movies__cards' });
}

export function renderLikedMovies({ htmlSelectorSection }) {
  const moviesLiked = getItemFromLocalStorage('cinema-liked');
  const moviesLikedArr = Object.values(moviesLiked);
  const section = document.querySelector(htmlSelectorSection);
  const fragment = document.createDocumentFragment();

  moviesLikedArr.forEach((item) => {
    const element = createMovieCard({ movie: item, lazy: true, isLiked: true });
    fragment.append(element);
  });
  section.innerHTML = '';
  section.appendChild(fragment);
}

// Create person card
export function createPersonCard({ person, lazy = false }) {
  const { name, profile_path: profilePath } = person;
  const personCard = document.createElement('article');
  // card.dataset.movieId = id;
  const profileUrlImg = `https://www.themoviedb.org/t/p/w300/${profilePath}`;
  personCard.classList.add('person__card');
  personCard.innerHTML = /* html */`
    <picture class="card__person-wrapper">
      <img src="${lazy ? '' : profileUrlImg}" data-img=${lazy ? profileUrlImg : ''} alt="Actor Photo - ${name}" class="card__person-img">
    </picture>
    <div class="overlay">
      <h4 class="card__person-name">${name}</h4>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
    </div>
  `;

  // Check the image and load the dafault it is a error in load
  const personImg = personCard.querySelector('img');
  if (lazy) {
    observerCardMovie.observe(personImg);
  }
  // Listener to default image on error loading case
  personImg.addEventListener('error', (e) => {
    personCard.classList.add('unload');
    loadDefaultImage(e, 'imgPerson');
  });
  return personCard;
}

export function createGenres(genre) {
  const { name, id } = genre;
  const nameCssVariable = getColorCategoryCssVariableByName(name);
  const colorCategory = getComputedStyle(document.body).getPropertyValue(`--color-genre-${nameCssVariable}`);
  const categoryElement = document.createElement('div');
  categoryElement.classList.add('category__item', `category__item-${id}}`);
  categoryElement.innerHTML = /* html */`
    <a href="#category=${id}-${name}" class="category__name">
      <span class="category__square" style="background-color:${colorCategory}"></span>
      <span>${name}</span>
    </a>
  `;
  return categoryElement;
}

export function addBackButton(cssSelector) {
  const element = document.querySelector(cssSelector);
  element.addEventListener('click', () => {
    console.log(window.history);
    const backUrl = window.history.state;
    console.log(backUrl);
    if (!backUrl) {
      window.history.back();
      return;
    }
    window.location.hash = '';
    // window.history.back();
  });
}

export async function renderMovieView({ htmlSelector, urlInfo }) {
  const [urlMovie, urlCredits] = urlInfo;
  const htmlElement = document.querySelector(htmlSelector);
  const movieDetails = await getListResults(urlMovie);
  const credits = await getListResults(urlCredits);

  const header = document.querySelector('.header__movie-details');
  header.style.backgroundImage = `linear-gradient(to bottom, rgba(45, 41, 64, 0.45), rgba(13, 23, 53, 1)), url('https://www.themoviedb.org/t/p/w1920_and_h800_multi_faces${movieDetails.backdrop_path}')`;
  const imgPoster = header.querySelector('.movie__poster-img');
  imgPoster.src = `https://www.themoviedb.org/t/p/w300_and_h450_bestv2${movieDetails.poster_path}`;
  imgPoster.alt = `Poster - ${movieDetails.title}`;

  const detailsSection = createMovieDetails(movieDetails, credits);
  htmlElement.innerHTML = '';
  htmlElement.appendChild(detailsSection);
}

function createMovieDetails(data, credits) {
  const article = document.createElement('article');
  article.classList.add('movie__article');
  const insertCategories = (categories) => categories
    .map(({ id, name }) => `<li class="categorie"><a href="/#category=${id}-${name}">${name}</a></li>`).join('');

  const producer = credits.crew.find(member => member.job === 'Producer');
  const director = credits.crew.find(member => member.job === 'Director');
  const movieVote = Math.ceil(data.vote_average * 10);

  article.innerHTML = /* html */`
      <div class="movie__grade">
        <span class="movie__grade-number">${movieVote}%</span>
        <div class="movie__grade-bar"></div>
      </div>

      <div class="movie__info-wrapped">
        <div class="movie__title">
          <h2 class="movie__title-text">${data.title}</h2>
          <ul class="movie__categories">
            ${insertCategories(data.genres)}
          </ul>
        </div>

        <div class="movie__resume">
          <h3 class="movie__resume-title">Overview</h3>
          <p class="movie__resume-text">${data.overview}</p>
        </div>

        <div class="movie__data">
          <p>
            <strong>Language</strong>
            <em>${data.spoken_languages[0].english_name}</em>
          </p>
          <p>
            <strong>Country</strong>
            <em>${data.production_countries[0].name}</em>
          </p>
          <p>
            <strong>Director</strong>
            <em>${director?.name ?? 'N/A'}</em>
          </p>
          <p>
            <strong>Producer</strong>
            <em>${producer?.name ?? 'N/A'}</em>
          </p>
        </div>
      </div>
  `;

  const bar = article.querySelector('.movie__grade-bar');

  if (movieVote < 35) bar.style.setProperty('--color-bar', '#ff3908');
  else if (movieVote > 35 && movieVote < 70) bar.style.setProperty('--color-bar', '#FFB608');
  else bar.style.setProperty('--color-bar', '#41d059');

  console.log(bar.style.getPropertyValue('--color-bar'));

  return article;
}

export function createCastCard(castPerson) {
  const characterCard = document.createElement('article');
  const { name, profile_path: profilePath, character } = castPerson;
  characterCard.classList.add('person__card');
  characterCard.innerHTML = /* html */`
    <picture class="card__cast-wrapper">
      <img src="https://www.themoviedb.org/t/p/w300/${profilePath}" alt="Actor Photo - ${name}" class="card__cast-img">
    </picture>
    <div class="">
      <h4 class="card__cast-name">${name}</h4>
      <p class="card__cast-name">${character}</p>
    </div>
  `;

  // Check the image and load the dafault it is a error in load
  const personImg = characterCard.querySelector('img');
  personImg.addEventListener('error', (e) => {
    characterCard.classList.add('unload');
    loadDefaultImage(e, 'imgPerson');
  });
  return characterCard;
}

export function createReview({ review }) {
  const { author, content, updated_at: dateReview } = review;
  const reviewEl = document.createElement('article');
  reviewEl.classList.add('movie__review');
  const date = new Date(dateReview);
  const dateFormat = date.toDateString();

  reviewEl.innerHTML = /* html */ `
    <div>
      <h3 class="review__title">A review by ${author}</h3>
      <p>
        <span class="review__date">${dateFormat}</span>
      </p>
    </div>
    <p class="review__content">
      ${content}
    </p>
  `;

  return reviewEl;
}

export function createProvider({ provider }) {
  const { logo_path: logoPathProvider, provider_name: nameProvider } = provider;
  const providerEl = document.createElement('article');
  providerEl.classList.add('movie__provider');
  providerEl.innerHTML = /* html */ `
    <figure class="provider__figure">
      <img src="https://media.themoviedb.org/t/p/original/${logoPathProvider}" alt="Logo - ${nameProvider}"></img>
      <figcaption>${nameProvider}</figcaption>
    </figure>
  `;

  return providerEl;
}

export function renderGallery() {

}

export function addCarouselMovement() {
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(carousel => {
    const leftBtn = carousel.querySelector('.carousel__button-left');
    const rightBtn = carousel.querySelector('.carousel__button-right');

    const innerCarousel = carousel.querySelector('.carousel__inner');
    const scrollPerItemValue = carousel.clientWidth - 20;

    leftBtn.addEventListener('click', () => scrollToLeft(innerCarousel, scrollPerItemValue));
    rightBtn.addEventListener('click', () => scrollToRight(innerCarousel, scrollPerItemValue));
  });
}

export function renderTranslation({ htmlSelector, view, section }) {
  const element = document.querySelector(htmlSelector);
  element.textContent = getTranslation({ view, section });
}

export function setHandleLanguage() {
  console.log('setHandleLanguage');
  const { language } = getItemFromLocalStorage('cinema-lang');
  const currentLanguage = language ?? 'en-US';
  const selectLanguages = document.querySelector('.language__select');
  console.log({ currentLanguage, options: selectLanguages.options });
  for (const option of selectLanguages.options) {
    if (option.value === currentLanguage) option.selected = true;
  }

  selectLanguages.addEventListener('change', (e) => {
    console.log(selectLanguages.value);
    console.log('listener');
    setItemFromLocalStorage('cinema-lang', { language: selectLanguages.value });
    location.reload();
  });
}
