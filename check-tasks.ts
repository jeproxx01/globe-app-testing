import { gettodotasks } from './services/jira';

async function main() {
  try {
    const tasks = await gettodotasks('kan');
    console.log('--- TO DO TASKS ---');
    for (const task of tasks) {
      console.log(`Key: ${task.key}`);
      console.log(`Summary: ${task.fields.summary}`);
      console.log(`Status: ${task.fields.status.name}`);
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

main();
