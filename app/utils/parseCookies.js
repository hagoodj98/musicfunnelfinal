import { parse } from "cookie"; //This method is used to transform the cookie string from the headers into a JavaScript object.
//file is designed to parse the cookies from the HTTP request headers and attach them directly to the req object as a more accessible JavaScript object. This makes it easier to handle cookies throughout your application by standardizing how cookies are extracted and used.
export default function parseCookies(req){
    //Check if the request headers have cookies
    const cookie = req.headers?.cookie;//This line checks if there are cookies in the request headers and retrieves them. The ?. operator is used to safely access the cookie property on headers
    //Parse the cookies and assign to req.cookies
    req.cookies = parse(cookie || '');//If cookie is undefined (which could happen if no cookies were sent with the request), it defaults to parsing an empty string '' to avoid passing undefined to the parse function, which would cause an error. The result is then assigned to req.cookies, augmenting the req object with a cookies property that contains the parsed cookies.
}