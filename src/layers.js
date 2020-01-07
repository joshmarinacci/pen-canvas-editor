import {Eye, EyeOff, PlusSquare} from "react-feather";
import {HBox, Toolbox, VBox} from "./util";
import React, {useEffect, useState} from "react";
import {EditableLabel} from './util.js'

function layerVisible(layer) {
    if(layer.visible) {
        return <Eye size={16}/>
    } else {
        return <EyeOff size={16}/>
    }
}


// panel for a single Layer. no DnD for now.
const LayerView = ({layer,selected,onSelect, onToggle}) => {
    return <HBox style={{
        border: '1px solid black',
        borderWidth:'1px 0px 0 0px',
        minWidth:'200px',
        backgroundColor: selected===layer?'aqua':'white'
    }}
                 onMouseDown={()=>onSelect(layer)}
    >
        <button className={"borderless"} style={{backgroundColor:'transparent'}}
            onMouseDown={(e)=>{
                e.preventDefault()
                e.stopPropagation()
            }}
                onClick={()=>{
            layer.visible = !layer.visible
            onToggle(layer)
        }}>{layerVisible(layer)}</button>
        <EditableLabel initialValue={layer.title} onDoneEditing={(v)=>{
            layer.title = v
            onSelect(layer)
        }}/>
        {/*{layer.thumb.canvas}*/}
    </HBox>
}

export const LayerWrapper = ({layers, selectedLayer, setLayer, redraw}) => {
    layers = layers.map((lay,i) => <LayerView key={i} layer={lay} selected={selectedLayer} onSelect={setLayer} onToggle={redraw}/>)
    return <VBox className={'right-column second-row'}>
        {layers}
        <Toolbox>
            <button className="borderless"><PlusSquare size={20}/></button>
        </Toolbox>
    </VBox>
}
