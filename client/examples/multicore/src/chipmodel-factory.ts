import {
    getBasicType, SChildElement, SModelElement, SModelElementSchema, SModelFactory, SModelRoot, SModelRootSchema,
    SParentElement
} from "../../../src/base"
import {
    Channel, ChannelSchema, Core, CoreSchema, Crossbar, CrossbarSchema, Processor, ProcessorSchema
} from "./chipmodel"
import { Direction } from "../../../src/utils"
import { CORE_WIDTH, CORE_DISTANCE } from "./views";


export class ChipModelFactory extends SModelFactory {

    createElement(schema: SModelElementSchema, parent?: SParentElement): SChildElement {
        try {
            if (this.isCoreSchema(schema)) {
                this.validate(schema, parent)
                const core = this.initializeChild(new Core(), schema, parent) as Core
                core.bounds = {
                    x: core.column * (CORE_WIDTH + CORE_DISTANCE),
                    y: core.row * (CORE_WIDTH + CORE_DISTANCE),
                    width: CORE_WIDTH,
                    height: CORE_WIDTH
                }
                return core
            } else if (this.isChannelSchema(schema)) {
                this.validate(schema, parent)
                return this.initializeChild(new Channel(), schema, parent)
            } else if (this.isCrossbarSchema(schema)) {
                return this.initializeChild(new Crossbar(), schema, parent)
            }
        } catch (e) {
            console.error(e.message)
        }
        return super.createElement(schema, parent)
    }

    createRoot(schema: SModelRootSchema): SModelRoot {
        if (schema instanceof Processor)
            return schema
        else if (this.isProcessorSchema(schema))
            return this.initializeRoot(new Processor(), schema)
        else
            return super.createRoot(schema)
    }

    private validate(coreOrChannel: CoreSchema | ChannelSchema, processor?: SParentElement) {
        if (processor) {
            if (!(processor instanceof Processor))
                throw new Error('Parent model element must be a Processor')
            let rowDelta = 0
            let columnDelta = 0
            if (this.isChannelSchema(coreOrChannel)) {
                switch (coreOrChannel.direction) {
                    case Direction.down:
                    case Direction.up:
                        rowDelta = 1
                        break
                    default:
                        columnDelta = 1
                        break;
                }
            }
            if (coreOrChannel.row < 0 || coreOrChannel.row >= processor.rows + rowDelta
                || coreOrChannel.column < 0 && coreOrChannel.column >= processor.columns + columnDelta)
                throw Error('Element coordinates are out of bounds ' + coreOrChannel)
        }
    }

    isProcessorSchema(schema: SModelElementSchema): schema is ProcessorSchema {
        return getBasicType(schema) == 'processor'
    }

    isCoreSchema(schema: SModelElementSchema): schema is CoreSchema {
        return getBasicType(schema) == 'core'
    }

    isChannelSchema(schema: SModelElementSchema): schema is ChannelSchema {
        return getBasicType(schema) == 'channel'
    }

    isCrossbarSchema(schema: SModelElementSchema): schema is CrossbarSchema {
        return getBasicType(schema) == 'crossbar'
    }
}
