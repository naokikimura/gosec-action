# Code review using gosec

Analyze code statically by using [gosec](https://github.com/securego/gosec/) in Github actions

## Inputs

### `files`

Specify directories

(Multiple directories can be specified by separating them with line feed)

### `options`

Changes `gosec` command line options.

Specify the options in JSON array format.
e.g.: `["-conf", ".gosecrc.json"]`

### `working_directory`

Changes the current working directory of the Node.js process

### `reporter_type_notation`

Change the reporter.

(Multiple can be specified separated by commas)

## Example usage

```yaml
name: Analyze code statically
"on": pull_request
jobs:
  reek:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Analyze code statically using gosec
        uses: naokikimura/gosec-action@v0
```

## Contributing
Bug reports and pull requests are welcome on GitHub at https://github.com/naokikimura/gosec-action

## License
The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
