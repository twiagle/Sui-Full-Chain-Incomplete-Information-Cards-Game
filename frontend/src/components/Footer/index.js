import "./index.css"

function Footer() {
    return (
        <div className="Footer">
            <div>Copyright © {new Date().getFullYear()} by twiagle</div>
            <div className="beian"
                onClick={() => window.open("https://beian.miit.gov.cn/", "_blank")}
            >
                沪ICP备2021019937号-2
            </div>
        </div>
    );
}
export default Footer;