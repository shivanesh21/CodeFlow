import "./ErrorMessage.css";

function ErrorMessage({message}){

    return(

        <div className="error-box">

            {message}

        </div>

    )

}

export default ErrorMessage;