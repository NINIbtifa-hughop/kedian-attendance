export const todayMonth = () => new Date().toISOString().slice(0, 7)
export function confirmAction(message: string, action: () => unknown | Promise<unknown>) { if (window.confirm(message)) void action() }
