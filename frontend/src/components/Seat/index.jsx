import cn from 'classnames';
import './style.css';

const Seat = (props) => {
  const { isMe, player, seat, ...otherProps } = props;
  const empty = !player;
  const name = player?.name;
  return (
    <div {...otherProps}>
      <div className={cn('seat', { 'seat-empty': empty, 'seat-me': isMe })}>
        {empty ? '👤' : ['👸', '👨‍💻', '👩‍💻', '🤴'][seat % 3]}
        <div className='seat-badge'>
          {seat}
        </div>
      </div>
      {!empty && (
        <div className="seat-name">
          {name}
        </div>
      )}
    </div>
  );
};

export default Seat;
