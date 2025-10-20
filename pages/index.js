import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function handleFetch() {
    setError('');
    setData(null);
    if (!url) { setError('Masukkan link TikTok'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok || !json || json.status === false) {
        setError(json?.message || 'Gagal mengambil data');
      } else {
        setData(json);
      }
    } catch (err) {
      setError('Network error');
    } finally { setLoading(false); }
  }

  function downloadProxy(u, filename) {
    const link = `/api/proxy?u=${encodeURIComponent(u)}&fn=${encodeURIComponent(filename)}`;
    // open in new tab so browser handles download via Content-Disposition
    window.open(link, '_blank');
  }

  return (
    <div>
      <Head>
        <title>VectorDownloader — TikTok Downloader</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container-vd">
        <div className="card-vd">
          <div className="d-flex align-items-center mb-3">
            <img src="/logo.svg" alt="logo" width="56" height="56" style={{borderRadius:12, marginRight:12}}/>
            <div>
              <div style={{fontWeight:700, fontSize:20}}>VectorDownloader</div>
              <div className="small-muted">Download video, foto, dan musik TikTok — cepat & gratis</div>
            </div>
          </div>

          <div className="mb-3">
            <input value={url} onChange={e=>setUrl(e.target.value)} className="form-control form-control-lg" placeholder="Tempel link TikTok (mis: https://www.tiktok.com/@user/video/123...)" />
          </div>

          <div className="d-flex gap-2">
            <button className="btn-vd flex-grow-1" onClick={handleFetch} disabled={loading}>{loading? 'Mencari...' : 'Cari & Tampilkan'}</button>
            <button className="btn btn-outline-secondary" onClick={()=>{ setUrl(''); setData(null); setError(''); }}>Reset</button>
          </div>

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          {data && (
            <div className="mt-4">
              <div style={{fontWeight:700}}>{data.author || ''}</div>
              <div className="small-muted mb-3">{data.description || ''}</div>

              <div className="preview-media">
                {data.video?.no_watermark && (
                  <div className="mb-3">
                    <video controls src={data.video.no_watermark}></video>
                    <div className="mt-2 d-flex gap-2">
                      <button className="btn btn-success" onClick={()=>downloadProxy(data.video.no_watermark, 'VectorDigital.mp4')}>Download Video (MP4)</button>
                      <a className="btn btn-outline-primary" href={data.video.no_watermark} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  </div>
                )}

                {data.music?.play_url && (
                  <div className="mb-3">
                    <audio controls src={data.music.play_url}></audio>
                    <div className="mt-2 d-flex gap-2">
                      <button className="btn btn-warning" onClick={()=>downloadProxy(data.music.play_url, 'VectorDigital.mp3')}>Download Audio (MP3)</button>
                      <a className="btn btn-outline-primary" href={data.music.play_url} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  </div>
                )}

                {data.images && data.images.length > 0 && (
                  <div className="mb-3">
                    <h6>Images</h6>
                    {data.images.map((img,i)=> (
                      <div key={i} className="mb-2">
                        <img src={img} alt={`img-${i}`} />
                        <div className="mt-2">
                          <button className="btn btn-outline-success" onClick={()=>downloadProxy(img, `VectorDigital_image_${i+1}.jpg`)}>Download Image</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

          <div className="mt-4 small text-muted">Mirip Snaptik / SSSTik — Untuk konten publik. Hormati hak cipta.</div>
        </div>
      </div>
    </div>
  );
    }
