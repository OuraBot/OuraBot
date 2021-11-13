// Ensures that the bot does not restart if an active task is underway
import { exec } from 'child_process';
export const activeTasks = new Set<string>();

export function addTask(channel: string, task: string) {
    activeTasks.add(`${channel}:${task}`);
}

export function removeTask(channel: string, task: string) {
    activeTasks.delete(`${channel}:${task}`);
}

export function areTasksRunning() {
    return activeTasks.size > 0;
}

export function safeRestart() {
    if (!areTasksRunning()) {
        console.log(`Restarting with ${activeTasks.size} active tasks`);

        exec('pm2 restart 11');
        // process.exit(0);
    } else {
        console.log(`There are ${activeTasks.size} active tasks...`);
        setTimeout(safeRestart, 100);
    }
}
