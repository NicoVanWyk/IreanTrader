// TextBox.tsx
import React from 'react';
import styles from './css/TextBox.module.css';

interface Props {
    messages: string[];
}

const TextBox: React.FC<Props> = ({ messages }) => {
    return (
        <div className={styles.textBox}>
            <h2>Messages:</h2>
            <ul>
                {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
        </div>
    );
};

export default TextBox;