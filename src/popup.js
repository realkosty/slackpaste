import React, { useEffect } from 'react'

import { usePopup } from './popupContext'

const Popup = () => {
    const { value, clearPopup } = usePopup()

    useEffect(() => {
        const timer = setTimeout(() => {
            clearPopup()
        }, 1500)
        return () => clearTimeout(timer)
    }, [value, clearPopup])

    return value ? <div>{value}</div> : null
}

export default Popup
