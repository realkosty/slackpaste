import React, { useEffect } from 'react'

import { usePopup } from './popupContext'

const Popup = () => {
    const { value, clearPopup } = usePopup()

    useEffect(() => {
        const timer = setTimeout(() => {
            clearPopup()
        }, 3000)
        return () => clearTimeout(timer)
    }, [value, clearPopup])

    return value ? <span className='popup'>{value}</span> : null
}

export default Popup
