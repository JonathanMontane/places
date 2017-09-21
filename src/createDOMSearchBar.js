import clearIcon from './icons/clear.svg';
import pinIcon from './icons/address.svg';

const createIconButton = ($prefix, $name, $icon) => {
  const iconButton = document.createElement('button');
  iconButton.setAttribute('type', 'button');
  iconButton.classList.add(`${$prefix}-input-icon`);
  iconButton.classList.add(`${$prefix}-icon-${$name}`);
  iconButton.innerHTML = $icon;
  return iconButton;
};

const hideClearButtonAndShowPinButton = (clearButton, pinButton) => {
  clearButton.style.display = 'none';
  pinButton.style.display = '';
};

const hidePinButtonAndShowClearButton = (clearButton, pinButton) => {
  clearButton.style.display = '';
  pinButton.style.display = 'none';
};

const resetAutoCompleteInstance = instance => {
  instance.autocomplete.setVal('');
  instance.focus();
};

const createSearchBar = ({
  container,
  prefix,
  autocompleteInstance,
  placesInstance,
}) => {
  const autocompleteContainer = container.parentNode;

  const clear = createIconButton(prefix, 'clear', clearIcon);
  const pin = createIconButton(prefix, 'pin', pinIcon);

  autocompleteContainer.appendChild(clear);
  autocompleteContainer.appendChild(pin);

  hideClearButtonAndShowPinButton(clear, pin);

  const onClearClick = () => {
    resetAutoCompleteInstance(autocompleteInstance);
    hideClearButtonAndShowPinButton(clear, pin);
    placesInstance.emit('clear');
  };

  pin.addEventListener('click', autocompleteInstance.focus);
  clear.addEventListener('click', onClearClick);

  let previousQuery = '';

  const inputListener = () => {
    const query = autocompleteInstance.val();
    if (query === '') {
      hideClearButtonAndShowPinButton(clear, pin);
      if (previousQuery !== query) {
        placesInstance.emit('clear');
      }
    } else {
      hidePinButtonAndShowClearButton(clear, pin);
    }
    previousQuery = query;
  };

  autocompleteContainer
    .querySelector(`.${prefix}-input`)
    .addEventListener('input', inputListener);

  // FIX ME - only instance of DOM manipulation with placesInstance
  placesInstance.destroy = (...args) => {
    autocompleteContainer
      .querySelector(`.${prefix}-input`)
      .removeEventListener('input', inputListener);

    autocompleteInstance.autocomplete.destroy(...args);
  };
};

export default createSearchBar;
