import React, { createContext, useState, useContext } from 'react'

// from https://medium.com/@danielbillson/creating-a-popup-in-react-with-hooks-and-context-4806bc7d82e7
// this one is copied for now, since I haven't gotten to the context section of react course yet
// so hoping I'll find some time to actually understand :)

const PopupContext = createContext()

export const PopupProvider = ({ children }) => {
    const [value, setValue] = useState()
    const triggerPopup = text => setValue(text)
    const clearPopup = () => setValue()

    return (
        <PopupContext.Provider value={{ value, triggerPopup, clearPopup }}>
            {children}
        </PopupContext.Provider>
    )
}

export const usePopup = () => useContext(PopupContext)