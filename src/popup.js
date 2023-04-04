import React, { useEffect } from 'react'

import { usePopup } from './popupContext'

const Popup = () => {
    const { value, clearPopup } = usePopup()

    useEffect(() => {
        const timer = setTimeout(() => {
            clearPopup()
        }, 4000)
        return () => clearTimeout(timer)
    }, [value, clearPopup])

    return value ? <div className='popup'>{value}</div> : null
}

export default Popup
