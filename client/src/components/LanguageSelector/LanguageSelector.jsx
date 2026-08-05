import "./LanguageSelector.css";

function LanguageSelector({ language, setLanguage }) {

    const languages = [
        "javascript",
        "python",
        "java",
        "cpp",
        "c"
    ];

    return (

        <div className="language-selector">

            <label>Select Language</label>

            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
            >

                {

                    languages.map((lang) => (

                        <option
                            key={lang}
                            value={lang}
                        >

                            {lang.toUpperCase()}

                        </option>

                    ))

                }

            </select>

        </div>

    );

}

export default LanguageSelector;
