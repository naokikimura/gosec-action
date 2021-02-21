import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import stream from 'stream';
import util from 'util';
import Command from '@moneyforward/command';
import StaticCodeAnalyzer from '@moneyforward/sca-action-core';
import { transform } from '@moneyforward/stream-util';
import { analyzer } from '@moneyforward/code-review-action/';

type AnalyzerConstructorParameter = analyzer.AnalyzerConstructorParameter;

const debug = util.debuglog('@naokikimura/code-review-action-gosec-plugin');

export default abstract class Analyzer extends StaticCodeAnalyzer {
  constructor(...args: AnalyzerConstructorParameter[]) {
    super('gosec', args.map(String).concat('-no-fail', '-fmt', 'golint'));
  }

  protected async prepare(): Promise<void> {
    console.log('::group::Installing packages...');
    try {
      const gopath = await Command.substitute('go', ['env', 'GOPATH']);
      await function pipeline(...subprocesses: ChildProcessWithoutNullStreams[]) {
        return new Promise<void>((resolve, reject) => {
          const subprocess = subprocesses
            .map(subprocess => {
              subprocess.stderr.pipe(process.stderr);
              subprocess.once('exit', (code, signal) => { if (code !== 0) reject([subprocess.spawnfile, code, signal]); });
              return subprocess;
            })
            .reduce((previous, current) => {
              previous.stdout.pipe(current.stdin);
              return current;
            }).once('exit', code => { if (code === 0) resolve(); });
          subprocess.stdout.pipe(process.stdout);
        })
      }(
        spawn('curl', ['-sSfL', 'https://raw.githubusercontent.com/securego/gosec/master/install.sh']),
        spawn('sh', ['-s', '--', '-b', path.join(gopath, 'bin')])
      );
      process.env['PATH'] = [path.join(gopath, 'bin'), process.env.PATH].join(path.delimiter);
      debug('%s', process.env.PATH);
    } finally {
      console.log('::endgroup::');
    }
  }

  protected createTransformStreams(): stream.Transform[] {
    return [
      new transform.Lines(),
      new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform: function (warning: string, _encoding, done): void {
          debug('%s', warning);
          const regex = /^(.+):(\d+):(\d+):\s(.+\s\(Rule:(\w+),\sSeverity:(\w+),\sConfidence:(\w+)\))$/;
          const [matches, file, line, column, message] = regex.exec(warning) || [];
          done(null, matches && {
            file,
            line,
            column,
            message,
            severity: 'warning',
            code: 'gosec'
          });
        }
      })
    ];
  }
}
