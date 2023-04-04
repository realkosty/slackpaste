function DeleteButton({idToClear}) {
    function handleClick() {
        document.getElementById(idToClear).value = ''
    }

    return (
        <button className='delete-button' onClick={handleClick}>Clear Input</button>
    )
}

export default DeleteButton