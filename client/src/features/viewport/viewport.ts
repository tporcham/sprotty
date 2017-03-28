import { ContainerModule } from "inversify"
import { TYPES } from "../../base/types";
import { BehaviorSchema } from "../../base/model/behavior"
import { SModelElement, SModelRoot } from "../../base/model/smodel"
import { Action } from "../../base/intent/actions"
import { AbstractCommand, CommandExecutionContext, Command } from "../../base/intent/commands"
import { isSizeable } from "../resize/resize"
import { Animation } from "../../base/animations/animation"
import { CenterCommand, FitToScreenCommand, CenterKeyboardListener } from "./center-fit"
import { ScrollMouseListener, Scrollable } from "./scroll"
import { ZoomMouseListener, Zoomable } from "./zoom"

export const viewportFeature = Symbol('viewportFeature')

export const viewportModule = new ContainerModule(bind => {
    bind(TYPES.ICommand).toConstructor(CenterCommand)
    bind(TYPES.ICommand).toConstructor(FitToScreenCommand)
    bind(TYPES.ICommand).toConstructor(ViewportCommand)
    bind(TYPES.KeyListener).to(CenterKeyboardListener)
    bind(TYPES.MouseListener).to(ScrollMouseListener)
    bind(TYPES.MouseListener).to(ZoomMouseListener)
})

export interface Viewport extends BehaviorSchema, Scrollable, Zoomable {
}

export function isViewport(element: SModelElement): element is SModelElement & Viewport & Scrollable & Zoomable {
    return element.hasFeature(viewportFeature)
        && 'zoom' in element
        && 'scroll' in element
}

export class ViewportAction implements Action {
    kind = ViewportCommand.KIND

    constructor(public elementId: string, public readonly newViewport: Viewport, public animate: boolean) {
    }
}

export class ViewportCommand extends AbstractCommand {
    static readonly KIND = 'viewport'

    element: SModelElement & Viewport
    oldViewport: Viewport
    newViewport: Viewport

    constructor(public action: ViewportAction) {
        super()
        this.newViewport = action.newViewport
    }

    execute(model: SModelRoot, context: CommandExecutionContext) {
        const element = model.index.getById(this.action.elementId)
        if (element && isViewport(element)) {
            this.element = element
            this.oldViewport = {
                scroll: this.element.scroll,
                zoom: this.element.zoom,
            }
            if (this.action.animate)
                return new ViewportAnimation(this.element, this.oldViewport, this.newViewport, context).start()
            else {
                this.element.scroll = this.newViewport.scroll
                this.element.zoom = this.newViewport.zoom
                if(isSizeable(this.element))
                    this.element.autosize = true
            }
        }
        return model
    }

    undo(model: SModelRoot, context: CommandExecutionContext) {
        return new ViewportAnimation(this.element, this.newViewport, this.oldViewport, context).start()
    }

    redo(model: SModelRoot, context: CommandExecutionContext) {
        return new ViewportAnimation(this.element, this.oldViewport, this.newViewport, context).start()
    }

    merge(command: Command, context: CommandExecutionContext) {
        if (!this.action.animate && command instanceof ViewportCommand && this.element == command.element) {
            this.newViewport = command.newViewport
            return true
        }
        return false
    }
}

export class ViewportAnimation extends Animation {

    private zoomFactor: number

    constructor(private element: SModelElement & Viewport,
                private oldViewport: Viewport,
                private newViewport: Viewport,
                protected context: CommandExecutionContext) {
        super(context)
        this.zoomFactor = Math.log(newViewport.zoom / oldViewport.zoom)
    }

    tween(t: number) {
        this.element.scroll = {
            x: (1 - t) * this.oldViewport.scroll.x + t * this.newViewport.scroll.x,
            y: (1 - t) * this.oldViewport.scroll.y + t * this.newViewport.scroll.y
        }
        this.element.zoom = this.oldViewport.zoom * Math.exp(t * this.zoomFactor)
        if(isSizeable(this.element))
            this.element.autosize = true
        return this.context.root
    }
}
