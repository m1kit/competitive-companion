import { Contest } from '../../models/Contest';
import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement, markdownToHtml } from '../../utils/dom';
import { Parser } from '../Parser';
import { CodeChefProblemParser } from '../problem/CodeChefProblemParser';

export class CodeChefContestParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['https://www.codechef.com/*'];
  }

  public canHandlePage(): boolean {
    return document.querySelector('.cc-problem-name a') !== null;
  }

  public parse(url: string, html: string): Promise<Sendable> {
    return new Promise(async (resolve, reject) => {
      const elem = htmlToElement(html);

      const links: string[] = [
        ...elem.querySelectorAll('.cc-problem-name a'),
      ].map(el =>
        (el as any).href.replace(
          'www.codechef.com/',
          'www.codechef.com/api/contests/',
        ),
      );

      let bodies: string[];

      try {
        bodies = await this.fetchAll(links);
      } catch (err) {
        reject(err);
        return;
      }

      const models = bodies.map(body => JSON.parse(body));
      const tasks = [];

      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const task = new TaskBuilder().setUrl(
          links[i].replace(
            'www.codechef.com/api/contests/',
            'www.codechef.com/',
          ),
        );

        task.setName(model.problem_name);
        task.setGroup('CodeChef - ' + model.contest_name);

        const body = markdownToHtml(model.body);
        new CodeChefProblemParser().parseTests(body, task);

        task.setTimeLimit(parseFloat(model.max_timelimit) * 1000);
        task.setMemoryLimit(256);

        tasks.push(task.build());
      }

      resolve(new Contest(tasks));
    });
  }
}
