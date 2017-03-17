import "reflect-metadata"
import {injectable, inject} from "inversify"
import {TYPES} from "../types"
import {Action, ActionHandlerRegistry, UndoAction, RedoAction} from "./actions"
import {ICommandStack} from "./command-stack"

/**
 * Collects actions, converts them to commands and dispatches them.
 */
@injectable()
export class ActionDispatcher {

    @inject(ActionHandlerRegistry) protected actionHandlerRegistry: ActionHandlerRegistry
    @inject(TYPES.ICommandStack) protected commandStack: ICommandStack

    dispatchAll(actions: Action[]): void {
        actions.forEach(action => this.dispatch(action))
    }

    dispatch(action: Action) {
        if (action.kind == UndoAction.KIND)
            this.commandStack.undo()
        else if (action.kind == RedoAction.KIND)
            this.commandStack.redo()
        else if (this.actionHandlerRegistry.hasKey(action.kind))
            this.handleAction(action)
    }

    protected handleAction(action: Action) {
        const actionHandler = this.actionHandlerRegistry.get(action.kind)
        const commands = actionHandler.handle(action)
        if (commands.length > 0) {
            this.commandStack.execute(commands)
        }
    }

}

export type ActionDispatcherProvider = () => Promise<ActionDispatcher>
