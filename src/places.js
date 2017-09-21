import EventEmitter from 'events';

import algoliasearch from 'algoliasearch/src/browser/builds/algoliasearchLite.js';
import autocomplete from 'autocomplete.js';

import './navigatorLanguage.js';

import createAutocompleteDataset from './createAutocompleteDataset.js';

import css from './places.css';
import createSearchBar from './createDOMSearchBar.js';

import insertCss from 'insert-css';
insertCss(css, { prepend: true });

import errors from './errors.js';

class PlacesProxyEventEmitter extends EventEmitter {
  autocomplete = null;

  onError = e => this.emit('error', e);

  onHits = ({ hits, rawAnswer, query }) =>
    this.emit('suggestions', {
      rawAnswer,
      query,
      suggestions: hits,
    });

  onRateLimitReached = () => {
    const listeners = this.listenerCount('limit');
    if (listeners === 0) {
      console.log(errors.rateLimitReached); // eslint-disable-line
      return;
    }

    this.emit('limit', { message: errors.rateLimitReached });
  };

  onSuggestion = (_, suggestion) => {
    this.emit('change', {
      rawAnswer: suggestion.rawAnswer,
      query: suggestion.query,
      suggestion,
      suggestionIndex: suggestion.hitIndex,
    });
  };

  onCursorChange = (_, suggestion) => {
    this.emit('cursorchanged', {
      rawAnswer: suggestion.rawAnswer,
      query: suggestion.query,
      suggestion,
      suggestionIndex: suggestion.hitIndex,
    });
  };

  bindToAutocompleteInstance = autocompleteInstance => {
    const autocompleteChangeEvents = ['selected', 'autocompleted'];

    autocompleteChangeEvents.forEach(eventName => {
      autocompleteInstance.on(`autocomplete:${eventName}`, this.onSuggestion);
    });

    autocompleteInstance.on('autocomplete:cursorchanged', this.onCursorChange);

    const autocompleteMethods = ['open', 'close', 'getVal', 'setVal'];

    autocompleteMethods.forEach(methodName => {
      this[methodName] = autocompleteInstance.autocomplete[methodName];
    });

    this.autocomplete = autocompleteInstance;
  };
}

const normalizeOptions = options => {
  const { container } = options;

  // multiple DOM elements targeted
  if (container instanceof NodeList) {
    if (container.length > 1) {
      throw new Error(errors.multiContainers);
    }

    // if single node NodeList received, resolve to the first one
    return normalizeOptions({ ...options, container: container[0] });
  }

  // container sent as a string, resolve it for multiple DOM elements issue
  if (typeof container === 'string') {
    const resolvedContainer = document.querySelectorAll(container);
    return normalizeOptions({ ...options, container: resolvedContainer });
  }

  // if not an <input>, error
  if (!(container instanceof HTMLInputElement)) {
    throw new Error(errors.badContainer);
  }

  return options;
};

const prepareAutocompleteOptions = ({
  style,
  prefix,
  userAutocompleteOptions,
}) => ({
  autoselect: true,
  hint: false,
  cssClasses: {
    root: `algolia-places${style === false ? '-nostyle' : ''}`,
    prefix,
  },
  debug: process.env.NODE_ENV === 'development',
  ...userAutocompleteOptions,
});

const prepareAutocompleteDataset = ({ options, placesInstance }) =>
  createAutocompleteDataset({
    ...options,
    algoliasearch,
    onHits: placesInstance.onHits,
    onError: placesInstance.onError,
    onRateLimitReached: placesInstance.onRateLimitReached,
    container: undefined,
  });

const createAutocompleteInstance = ({
  container,
  style,
  prefix,
  userAutocompleteOptions,
  options,
  placesInstance,
}) => {
  const autocompleteOptions = prepareAutocompleteOptions({
    style,
    prefix,
    userAutocompleteOptions,
  });

  const autocompleteDataset = prepareAutocompleteDataset({
    options,
    placesInstance,
  });

  return autocomplete(container, autocompleteOptions, autocompleteDataset);
};

export default function places(options) {
  const normalizedOptions = normalizeOptions(options);
  const {
    container,
    style,
    autocompleteOptions: userAutocompleteOptions = {},
  } = normalizedOptions;

  const prefix = `ap${style === false ? '-nostyle' : ''}`;

  const placesInstance = new PlacesProxyEventEmitter();
  const autocompleteInstance = createAutocompleteInstance({
    container,
    style,
    prefix,
    userAutocompleteOptions,
    options,
    placesInstance,
  });

  placesInstance.bindToAutocompleteInstance(autocompleteInstance);

  createSearchBar({
    container,
    prefix,
    autocompleteInstance,
    placesInstance,
  });

  return placesInstance;
}
