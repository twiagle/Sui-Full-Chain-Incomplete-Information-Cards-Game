import SeatList from '../../../components/SeatList';
import StaticPokerList from '../../../components/StaticPokerList';
import Operation from './Operation';
import './style.css';

const GamingRoom = (props) => {
  const { room, game, seat, ...otherProps } = props;
  const isPlayer = !!seat;

  return (
    <div className='gameroom' {...otherProps}>
      <SeatList
        className='room-seat'
        vertical
        seat={seat}
        players={room.players}
        render={(_seat) => (
          <>
            <div className='room-seat-info' style={{ animation: _seat === seat && game.turn === seat ? 'fade 800ms infinite' : undefined }}>
              <div className='room-seat-role' style={{ color: game.turn === _seat ? 'red' : undefined }}>{game.state === 2 && game.landlord === _seat ? '👲 Landlord' : '👨‍🌾 farmer'}</div>
              <div><span className='room-seat-rest' style={game.held[_seat] < 3 ? { color: 'red' } : undefined}>{game.held[_seat]}</span> cards </div>
            </div>
            {game.state === 2 && (
              <StaticPokerList ids={game.last[_seat]} overlap sort height={58} style={{ flex: '1 0 auto', marginLeft: 24, backgroundColor: game.top === _seat ? '#eee' : undefined }} />
            )}
          </>
        )}
      />
      {isPlayer && <Operation game={game} room={room} seat={seat} />}

    </div>

  );
};

export default GamingRoom;
