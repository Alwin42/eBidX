import { useState, useEffect } from "react";

const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    if (!targetDate) return {};

    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && interval !== "seconds") return;

    timerComponents.push(
      <span key={interval} className="mx-1 flex flex-col items-center">
        <span className="font-bold text-2xl leading-none">{timeLeft[interval]}</span>
        <span className="text-[10px] uppercase tracking-tighter opacity-80">{interval}</span>
      </span>,
    );
  });

  return (
    <div className="flex justify-center items-center gap-2 p-3 mb-4 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-inner transition-colors">
      {timerComponents.length ? (
        <div className="flex items-center gap-1">
          {timerComponents}
        </div>
      ) : (
        <span className="text-red-500 dark:text-red-400 font-bold uppercase tracking-widest text-sm">
          Auction Ended
        </span>
      )}
    </div>
  );
};

export default CountdownTimer;
