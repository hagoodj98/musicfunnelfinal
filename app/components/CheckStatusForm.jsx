import { useEffect } from "react";


export default function CheckStatusForm() {

    useEffect(() => {
       // Auto-submit the form when the component mounts
        document.getElementById('checkStatusForm').submit();
    }, []);
    return (
        <div>
            <p>Processing subscription...</p>
            <form id="checkStatusForm" action="/api/check-status" method="POST" style={{display: 'none'}}>

            </form>
        </div>
    
    );
}