# Foobar

This project creates a setup to create your next UI project using the following technologies.

1. Typescript
2. Webpack
3. Jest
4. Storybook

## Basic Usage

Pull down this repo and remove the git references in order to make it your own.

```bash
git remote remove origin
git remote add origin gitRemoteUrl
```

or just set a new remote url
```bash
git remote set-url origin git://new.url.here
```

## Quick Start

### Setting up server

```
const server = import "/src/start.js"

server.listen(9090);


```
Then run thru the installation steps listed below

## Installation

```bash
npm install
```

## Usage

### Local Development

#### Running Locally

```bash
npm run dev
```

#### Testing

```bash
npm run test
```

```javascript
import foobar

foobar.pluralize('word') # returns 'words'
foobar.pluralize('goose') # returns 'geese'
foobar.singularize('phenomena') # returns 'phenomenon'
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
