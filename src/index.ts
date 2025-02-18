import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';

/**
 * Initialization data for the jlx extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jlx:plugin',
  description: 'A JupyterLab extension for cell IDs',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension jlx is activated!');

    notebookTracker.widgetAdded.connect((_, notebookPanel) => {
      notebookPanel.sessionContext.ready.then(() => {
        const kernel =  notebookPanel.sessionContext.session?.kernel;
        if (!kernel) return;

        attachKernelHooks(kernel, notebookPanel);
      });

      notebookPanel.sessionContext.kernelChanged.connect((_, args) => {
        if (args.newValue) {
          attachKernelHooks(args.newValue, notebookPanel);
        }
      });
    });
  }
}

function attachKernelHooks(kernel: IKernelConnection, notebookPanel: NotebookPanel): void {
  kernel.anyMessage.connect((_, msg) => {
    if (msg.direction === 'send' && msg.msg.header.msg_type === 'execute_request') {
      const content = msg.msg.content as any;
      
      if (content && typeof content === 'object' && 'code' in content) {
        const code = content.code as string;
        const executingCell = getExecutingCell(notebookPanel, code);
        
        if (executingCell) {
          const cellId = executingCell.model.sharedModel.getMetadata('cell_id') as string | undefined
          if (cellId) {
            console.log(`Executing cell: ${cellId}`);
          } else {
            console.log('Executing cell with no id found');
          }
        }
      }
    }
  });
}

function getExecutingCell(notebookPanel: NotebookPanel, code: string): Cell | null {
  const notebook = notebookPanel.content;
  return notebook.widgets.find(cell => cell.model.sharedModel.source === code) ?? null;
}

export default plugin;
