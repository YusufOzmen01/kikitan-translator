/* eslint-disable react/react-in-jsx-scope */
"use client";

import "../style/carousel.css"

type ScrollProps = {
    light_mode: boolean
}

export default function Scroll({ light_mode }: ScrollProps) {
    return (
        <div className="carousel-container w-max">
            <div className={"text-3xl text-center " + (light_mode ? "text-black" : "text-white")}>
                {[
                    "Choose your language",
                    "言語を選択してください",
                    "选择语言",
                    "언어를 선택하세요",
                    "Dilinizi seçin",
                    "Choose your language",

                ].map((item, index) => (
                    <div key={index} className="carousel-item">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}