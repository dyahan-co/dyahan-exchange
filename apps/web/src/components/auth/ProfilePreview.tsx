import hero from '../../assets/u02r-hero.jpg';
export function ProfilePreview({ nickname }: { nickname: string }) {
  return (
    <>
      <div className="profile-preview">
        <img src={hero} alt="" />
        <div className="profile-overlay">
          <div className="avatar-chip">{nickname.trim().slice(0, 1).toUpperCase() || 'Д'}</div>
          <span>
            <small>НОВЫЙ ИГРОК</small>
            <b>{nickname.trim() || 'Твой никнейм'}</b>
            <em>СТАТУС · ГОСТЬ</em>
          </span>
          <strong>
            +1 <small>КУМ</small>
          </strong>
        </div>
      </div>
      <p className="preview-caption">Твой профиль появится в чате, заявках и рейтинге.</p>
    </>
  );
}
