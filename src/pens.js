import React from 'react'
import {VBox} from './util.js'

// panel that shows settings for a pen, let you customize them
const PenEditor = () => {
    return <div> edit the pen</div>
};

export const RecentPens = ({pens, selected, onSelect, onChange}) => {
    return <VBox style={{
        minWidth:'100px',
        border:'1px solid black',
    }}>{pens.map((pen, i) => {
        return <button
            style={{
                backgroundColor:pen===selected?'aqua':'white',
                border:'1px solid black',
            }}
            key={i}
            onClick={()=>onSelect(pen)}
        >{pen.title} {pen.radius}</button>
    })
    }
    </VBox>
};
