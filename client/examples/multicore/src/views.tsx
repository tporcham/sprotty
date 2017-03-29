import {View, RenderingContext} from "../../../src/base/view/views"
import {VNode} from "snabbdom/vnode"
import {Chip, Core, Channel, Crossbar} from "./chipmodel"
import {Direction} from "../../../src/utils/geometry"
import {ColorMap, toSVG} from "../../../src/utils/color"
import * as snabbdom from "snabbdom-jsx"
import {ThunkView} from "../../../src/base/view/thunk-view"

const JSX = {createElement: snabbdom.svg}

export class ChipView implements View {
    render(model: Chip, context: RenderingContext): VNode {
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`
        return <svg key={model.id} id={model.id}>
                <g transform={transform}>
                    {context.viewer.renderChildren(model, context)}
                </g>
            </svg>
    }
}

const CORE_WIDTH = 45
const CORE_HEIGHT = 20

export class CoreView extends ThunkView {

    selector(model: Core) {
        return 'g'
    }

    watchedArgs(model: Core) {
        return [model.load, model.selected]
    }

    doRender(model: Core, context: RenderingContext): VNode {
        const position = {
            x: model.column * (CORE_WIDTH + CORE_HEIGHT),
            y: model.row * (CORE_WIDTH + CORE_HEIGHT),
        }
        const nodeName = this.padLeft(model.row) + this.padLeft(model.column)
        const transform = 'translate(' + position.x + ',' + position.y + ')'
        return <g class-core={true}
                  id={model.id}
                  key={model.id}
                  transform={transform}>
                <rect width={CORE_WIDTH}
                      height={CORE_WIDTH}
                      rx={4}
                      ry={4}
                      fill={LoadColor.getSVG(model.load)}/>
                <text class-text={true} x={CORE_WIDTH / 2} y={CORE_WIDTH / 2}>{nodeName}</text>
            </g>
    }

    private padLeft(n: number): string {
        if (n < 10)
            return '0' + n
        else
            return '' + n
    }
}

export class CrossbarView implements View {
    render(model: Crossbar, context: RenderingContext): VNode {
        const rows = (model.parent as Chip).rows
        const columns = (model.parent as Chip).rows
        let x: number
        let y: number
        let width: number
        let height: number
        switch (model.direction) {
            case Direction.up:
                width = rows * (CORE_WIDTH + CORE_HEIGHT) - CORE_HEIGHT
                height = CORE_HEIGHT
                x = 0
                y = -2 * CORE_HEIGHT
                break;
            case Direction.down:
                width = rows * (CORE_WIDTH + CORE_HEIGHT) - CORE_HEIGHT
                height = CORE_HEIGHT
                x = 0
                y = rows * (CORE_WIDTH + CORE_HEIGHT)
                break;
            case Direction.left:
                x = -2 * CORE_HEIGHT
                y = 0
                width = CORE_HEIGHT
                height = columns * (CORE_WIDTH + CORE_HEIGHT) - CORE_HEIGHT
                break;
            case Direction.right:
            default:
                x = rows * (CORE_WIDTH + CORE_HEIGHT)
                y = 0
                width = CORE_HEIGHT
                height = columns * (CORE_WIDTH + CORE_HEIGHT) - CORE_HEIGHT
                break;
        }
        return <rect class-crossbar={true}
                     id={model.id}
                     key={model.id}
                     width={width}
                     height={height}
                     x={x}
                     y={y} />
    }
}

class LoadColor {
    static colorMap = new ColorMap([
        {red: 0.9, green: 0.9, blue: 0.9},
        {red: 0, green: 1, blue: 0},
        {red: 1, green: 1, blue: 0},
        {red: 1, green: 0, blue: 0}
    ])

    static getSVG(load: number): string {
        return toSVG(LoadColor.colorMap.getColor(load))
    }
}

const CHANNEL_WIDTH = 2

export class ChannelView extends ThunkView {

    watchedArgs(model: Channel): any[] {
        return [model.load, this.isVisible(model)]
    }

    selector(model: Channel): string {
        return 'polygon'
    }

    isVisible(model: Channel): boolean {
        return (model.root as Chip).zoom * CHANNEL_WIDTH > 3
    }

    doRender(model: Channel, context: RenderingContext): VNode {
        if (!this.isVisible(model))
            return <g id={model.id} key={model.id}></g>
        let points: number[]
        switch (model.direction) {
            case Direction.up:
                points = [
                    0.75 * CORE_WIDTH - CHANNEL_WIDTH,
                    0,
                    0.75 * CORE_WIDTH + CHANNEL_WIDTH,
                    0,
                    0.75 * CORE_WIDTH,
                    -CORE_HEIGHT
                ]
                break;
            case Direction.down:
                points = [
                    0.25 * CORE_WIDTH - CHANNEL_WIDTH,
                    -CORE_HEIGHT,
                    0.25 * CORE_WIDTH + CHANNEL_WIDTH,
                    -CORE_HEIGHT,
                    0.25 * CORE_WIDTH,
                    0
                ]
                break;
            case Direction.left:
                points = [
                    0,
                    0.25 * CORE_WIDTH - CHANNEL_WIDTH,
                    0,
                    0.25 * CORE_WIDTH + CHANNEL_WIDTH,
                    -CORE_HEIGHT,
                    0.25 * CORE_WIDTH
                ]
                break;
            case Direction.right:
            default:
                points = [
                    -CORE_HEIGHT,
                    0.75 * CORE_WIDTH - CHANNEL_WIDTH,
                    -CORE_HEIGHT,
                    0.75 * CORE_WIDTH + CHANNEL_WIDTH,
                    0,
                    0.75 * CORE_WIDTH
                ]
        }
        const position = {
            x: model.column * (CORE_WIDTH + CORE_HEIGHT),
            y: model.row * (CORE_WIDTH + CORE_HEIGHT),
        }

        const transform = 'translate(' + position.x + ',' + position.y + ')'
        return <polygon class-channel={true}
                        id={model.id}
                        key={model.id}
                        points={points}
                        transform={transform}
                        fill={LoadColor.getSVG(model.load)} />
    }
}