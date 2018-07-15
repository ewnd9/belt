# belt-tools

Convinience wrappers for scripts with logging

## Install

```sh
$ npm install @belt/tools
# or
$ yarn add @belt/tools
```

## Usage

```js
const { execa, opn } = require('@belt/tools');
// or
const execa = require('@belt/tools/modules/execa');
const opn = require('@belt/tools/modules/opn');

execa('echo', ['hello world']);
// prints "$ echo 'hello world'"
```

## License

MIT © [ewnd9](http://ewnd9.com)
