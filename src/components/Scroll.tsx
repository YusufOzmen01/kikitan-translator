/* eslint-disable react/react-in-jsx-scope */
"use client";

import "../style/carousel.css"

export default function Scroll() {
    return (
        <div className="carousel-container w-max">
            <div className="text-3xl text-center text-black">
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