import { createMovieCard, renderListResults, addBackButton, renderNoMoreResults, setHandleLanguage, renderTranslation } from '../js/dom.js';
import { render, addIntersectionObserverToLoadMore } from '../js/utils.js';

export default async function() {
  // Bring the styles
  await import('../styles/pages/movies-list.scss');

  // Render the playNow movies
  render('#movies-list__view', () => {
    renderListResults({
      htmlSelectorSection: '.movies__list',
      callbackRender: (item) => createMovieCard({ movie: item, lazy: true }),
      urlInfo: {
        name: 'nowPlayingMovies',
        propertyPath: 'results'
      }
    }).then(data => {
      // Intersection observer for load more
      const footer = document.querySelector('.footer');
      const renderMoreResultsFn = renderMoreResultsCb();
      addIntersectionObserverToLoadMore({
        callbackIntersecting: renderMoreResultsFn,
        callbackEndIntersecting: () => renderNoMoreResults({ htmlSelectorSection: '.movies__list' }),
        elementToObserve: footer,
        maxPage: data.total_pages
      });
    });
  });

  // Language
  setHandleLanguage();
  renderTranslation({ htmlSelector: '.view__list-subtitle', view: '/', section: 'playing' });

  // add the back button
  addBackButton('.button__back');
}

function renderMoreResultsCb() {
  return function(page) {
    renderListResults({
      htmlSelectorSection: '.movies__list',
      callbackRender: (item) => createMovieCard({ movie: item, lazy: true }),
      urlInfo: {
        name: 'nowPlayingMovies',
        params: {
          page
        },
        propertyPath: 'results'
      },
      toClean: false
    });
  };
}
