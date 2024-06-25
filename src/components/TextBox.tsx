// TextBox.tsx
import React, { useEffect, useRef } from 'react';
import styles from './css/TextBox.module.css';

interface Props {
    messages: string[];
}

const TextBox: React.FC<Props> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={styles.textBox} ref={messagesEndRef}>
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