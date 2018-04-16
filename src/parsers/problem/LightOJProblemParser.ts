import { Parser } from '../Parser';
import { Sendable } from '../../models/Sendable';
import { htmlToElement } from '../../utils';
import { Test } from '../../models/Test';
import { TaskBuilder } from '../../models/TaskBuilder';

export class LightOJProblemParser extends Parser {
  getMatchPatterns(): string[] {
    return [
      'http://lightoj.com/volume_showproblem.php*',
      'http://www.lightoj.com/volume_showproblem.php*',
    ];
  }

  parse(url: string, html: string): Promise<Sendable> {
    return new Promise(resolve => {
      const elem = htmlToElement(html);
      const task = new TaskBuilder().setUrl(url);

      task.setName(elem.querySelector('#problem_name').textContent.trim());
      task.setGroup('LightOJ');

      const columns = elem.querySelectorAll('.MsoTableGrid > tbody > tr > td');
      const input = [...columns[2].querySelectorAll('span')].map(el => el.textContent.replace(/\n /g, '')).join('\n');
      const output = [...columns[3].querySelectorAll('span')].map(el => el.textContent.replace(/\n /g, '')).join('\n');
      task.addTest(new Test(input, output));

      const timeLimitStr = elem.querySelector('#mytable > tbody > tr > td:nth-child(1).two').textContent.trim();
      task.setTimeLimit(parseFloat(/Time Limit: ([0-9.]+) second/.exec(timeLimitStr)[1]) * 1000);

      const memoryLimitStr = elem.querySelector('#mytable > tbody > tr > td:nth-child(2).two').textContent.trim();
      task.setMemoryLimit(parseInt(/Memory Limit: (\d+) MB/.exec(memoryLimitStr)[1]));

      resolve(task.build());
    });
  }
}
