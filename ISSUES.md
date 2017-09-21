## Perceived Issues
- no .nvmrc
- the `placesInstance.destroy` is the only method related to placesInstance that handles DOM code.
There's maybe a better way to handle the DOM in a `destroy` event.

## Suggestions
- use `console.error` instead of `console.log` in
`places.test:places/dataset/writes a message to console when nobody listening to the limit event`
- move `format*` files into a folder called `templates` along with `defaultTemplates.js`
- separate places into 3 files:
  - `createDOMSearchBar.js` that handles DOM Manipulation of the search bar
  - `PlacesDecoratorEventEmitter.js` that handles events
  - `places.js` that initializes the two previous methods