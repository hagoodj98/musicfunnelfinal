import { parse } from "cookie";

export default function parseCookies(req){
    //Check if the request headers have cookies
    const cookie = req.headers?.cookie;
    //Parse the cookies and assign to req.cookies
    req.cookies = parse(cookie || '');
}