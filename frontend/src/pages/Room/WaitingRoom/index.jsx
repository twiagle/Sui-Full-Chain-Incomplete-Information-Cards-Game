import { useState } from 'react';
import { Spin } from "antd";
import './style.css';

const WaitingRoom = (props) => {
  // const { room, seat, ...otherProps } = props;
  const [disabled, setDisabled] = useState(false);
  const [isLoading, setIsloading] = useState(false)
  // const isPlayer = !!seat;

  return (
    <div className='waitingroom'>
      <br />
      <br />
      <br />
      <br />
      <Spin spinning tip={<span style={{ fontSize: '35px' }}>Loading...</span>}>
        <div style={{ marginTop: 21, textAlign: 'center', fontSize: '30px' }}>
          waitinng for other pepople
        </div>
      </Spin >
    </div>
  );
};

export default WaitingRoom;
