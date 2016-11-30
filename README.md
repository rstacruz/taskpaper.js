# taskpaper.js

> Taskpaper parser in JavaScript

Parses files in [Taskpaper] format, a very simple hierarchal note-taking format.

[Taskpaper]: https://www.taskpaper.com/

```yaml
Version 1:

    This file is in TaskPaper format.
    Tabs are used to indent.
    Each task begins with a "- ".
    Projects end with a ":".
    Tags are in the format "@tag_name".
    All other lines (such as these) are considered as notes,
    and are to be ignored.

    - User signup
        - Register for an account
        - Log in @done
        - Forget password

    - Manage users
        - Create users @in_progress
        - Delete users
        - User profile page @40%

    - Blog
        - Creating new posts @done
        - Comments @done
        - Moderating comments @done
```

## Installation

Install me via npm or [yarn](http://yarnpkg.com/).

```sh
npm install rstacruz/taskpaper
yarn add --exact rstacruz/taskpaper
```

## Usage

Use me via `require('taskpaper/es5')`.

```js
const parse = require('taskpaper/es5')
const output = parse('Hello:\n  - world')
console.log(output)
```

```js
// Output:
{ type: 'document',
  children: [
   { type: 'project',
     value: 'Hello',
     children: [
       { type: 'task',
         value: 'world' } ] } ] }
```

For the modern ES2016+ version (require Node 6+), just use `require('taskpaper')`.

## AST format

It returns a `Node`, which is an object. A Node has these attributes:

| Attribute  | Type       | Description                                         | In   |
| ----       | ----       | ----                                                | ---- |
| `type`     | *String*   | Either *document*, *note*, *task*, or *project*     | DNPT |
| `value`    | *String*   | The text in the project, task, or note              | NPT  |
| `children` | *Node[]*   | An array of nodes                                   | DPT  |
| `tags`     | *String[]* | List of tags                                        | PT   |
| `index`    | *Object*   | Where the node is in the format of `{line, column}` | NPT  |

## Thanks

**taskpaper.js** © 2016+, Rico Sta. Cruz. Released under the [MIT] License.<br>
Authored and maintained by Rico Sta. Cruz with help from contributors ([list][contributors]).

> [ricostacruz.com](http://ricostacruz.com) &nbsp;&middot;&nbsp;
> GitHub [@rstacruz](https://github.com/rstacruz) &nbsp;&middot;&nbsp;
> Twitter [@rstacruz](https://twitter.com/rstacruz)

[MIT]: http://mit-license.org/
[contributors]: http://github.com/rstacruz/taskpaper.js/contributors
