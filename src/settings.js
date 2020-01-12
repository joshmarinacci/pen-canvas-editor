import React, {useContext} from "react";
import {DialogContext, Spacer, VBox} from "./util";

export const SettingsDialog = ({storage})=>{
    const dm = useContext(DialogContext)
    const clearStorage = () => storage.clear().then(()=> console.log('everything is cleared'))
    return <VBox className={'dialog'}>
        <header>Open</header>
        <VBox className={'body'}>
            <button onClick={clearStorage}>clear local storage!</button>
        </VBox>
        <footer>
            <Spacer/>
            <button onClick={()=>dm.hide()}>close</button>
        </footer>
    </VBox>
}