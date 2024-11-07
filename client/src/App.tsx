import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

const App = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('서버에 연결되었습니다.');
    });

    socket.on('document', (data) => {
      // 서버로부터 초기 문서 상태 수신
      setContent(data);
    });

    socket.on('update', (data) => {
      // 다른 클라이언트로부터 변경 사항 수신
      setContent(data.content);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    // 서버로 변경 사항 전송
    socket.emit('update', { content: newContent });
  };

  return (
    <div>
      <h1>실시간 편집기</h1>
      <textarea
        value={content}
        onChange={handleChange}
        rows={10}
        cols={50}
        placeholder="여기에 입력하세요..."
      />
    </div>
  );
};

export default App;
