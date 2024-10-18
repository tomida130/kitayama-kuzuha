import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [upcomingTrains, setUpcomingTrains] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visitorCount, setVisitorCount] = useState(0);

  // JSONファイルからデータを取得する
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/timetable/kuzuha/time_saturday.json`)
      .then((response) => response.json())
      .then((data) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        // 現在時刻より後の電車をフィルタリング
        const filteredTrains = data.filter((train) => {
          const trainHour = parseInt(train.Hour, 10);
          const trainMin = parseInt(train.Min, 10);
          return (
            trainHour > currentHour ||
            (trainHour === currentHour && trainMin > currentMin)
          );
        });

        // 残り時間でソートして上位100件の電車を取得
        const sortedTrains = filteredTrains.sort((a, b) => {
          const timeA = parseInt(a.Hour, 10) * 60 + parseInt(a.Min, 10);
          const timeB = parseInt(b.Hour, 10) * 60 + parseInt(b.Min, 10);
          return timeA - timeB;
        });

        setUpcomingTrains(sortedTrains.slice(0, 100));
      })
      .catch((error) => console.error("Error fetching train data:", error));
  }, []);

  // 現在時刻をリアルタイムで更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // 残り時間が0未満の電車をリストから削除
      setUpcomingTrains((prevTrains) =>
        prevTrains.filter((train) => {
          const remainingTime = calculateRemainingMinutes(
            train.Hour,
            train.Min
          );
          return remainingTime > 0;
        })
      );
    }, 1000); // 1秒ごとに現在時刻と電車リストを更新
    return () => clearInterval(interval); // クリーンアップ
  }, []);

  // 残り時間を計算する関数 (分単位)
  const calculateRemainingMinutes = (hour, minute) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const trainTime = parseInt(hour, 10) * 60 + parseInt(minute, 10);
    const currentTime = currentHour * 60 + currentMin;

    return trainTime - currentTime;
  };

  // 経由地に応じた到着時間の計算
  const getArrivalTime = (via, hour, minute) => {
    let duration = 0;

    // 経由地に応じて所要時間を設定
    if (
      via.includes("大阪工大") &&
      via.includes("枚方ハイツ") &&
      via.includes("船橋")
    ) {
      duration = 23;
    } else if (via.includes("大阪工大") && via.includes("船橋")) {
      duration = 20;
    } else if (
      via.includes("家具団地") &&
      via.includes("田近二丁目") &&
      via.includes("船橋")
    ) {
      duration = 28;
    } else if (
      via.includes("家具団地") &&
      via.includes("枚方ハイツ") &&
      via.includes("船橋")
    ) {
      duration = 28;
    } else if (via.includes("家具団地") && via.includes("船橋")) {
      duration = 23;
    }

    // 出発時刻に所要時間を加算
    const departureTime = new Date();
    departureTime.setHours(parseInt(hour, 10), parseInt(minute, 10));
    const arrivalTime = new Date(departureTime.getTime() + duration * 60000);

    return arrivalTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 残り時間に応じて色を設定
  const getTimeColor = (hour, minute) => {
    const remainingTime = calculateRemainingMinutes(hour, minute);

    if (remainingTime <= 3) {
      return "red"; // 残り3分以内
    } else if (remainingTime <= 5) {
      return "yellow"; // 残り5分以内
    } else if (remainingTime <= 10) {
      return "orange"; // 残り10分以内
    }
    return "white"; // それ以外
  };

  // ページ訪問者数のカウント (1つのデバイスごと)
  useEffect(() => {
    const visitCount = localStorage.getItem("visitCount") || 0;
    const updatedVisitCount = parseInt(visitCount, 10) + 1;
    localStorage.setItem("visitCount", updatedVisitCount);
    setVisitorCount(updatedVisitCount);
  }, []);

  return (
    <div className="train-board">
      <header className="header">
        <h1>大阪工業大学枚方(北山中央)バス時刻表</h1>
        <div className="current-time">
          現在時刻: {currentTime.toLocaleTimeString()}
        </div>
        <div className="info">
          <p>東行: 大学の横, 北行: コスモスの前</p>
        </div>
      </header>
      <table className="train-table">
        <thead>
          <tr>
            <th>残り時間</th>
            <th>経由</th>
            <th>出発時刻</th>
            <th>到着時刻</th>
            <th>行き先</th>
            <th>のりば</th>
          </tr>
        </thead>
        <tbody>
          {upcomingTrains.map((train) => (
            <tr key={train.ID}>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>
                {calculateRemainingMinutes(train.Hour, train.Min)}分
              </td>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>
                {train.via}
              </td>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>{`${
                train.Hour
              }:${train.Min.padStart(2, "0")}`}</td>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>
                {getArrivalTime(train.via, train.Hour, train.Min)}
              </td>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>
                {train.destination}
              </td>
              <td style={{ color: getTimeColor(train.Hour, train.Min) }}>
                {train.platform}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="footer">
        <p>訪問者数: {visitorCount}</p>
        <p>現状平日のみです</p>
        <p>連絡先:m1m24a32@st.oit.ac.jp</p>
      </footer>
    </div>
  );
}

export default App;
