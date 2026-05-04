import { message, Modal } from 'antd'
import { domToPng } from 'modern-screenshot'
import { useCallback, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'

type Area = {
  x: number
  y: number
  width: number
  height: number
}

const FormDienNguoiDung = () => {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [tempImageUrl, setTempImageUrl] = useState<string>('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [formData, setFormData] = useState({ hoVaTen: '', chucVuDonVi: '', loiNhan: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setTempImageUrl(ev.target?.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', reject)
      image.src = url
    })

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      }, 'image/jpeg')
    })
  }

  const handleCropConfirm = async () => {
    try {
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(tempImageUrl, croppedAreaPixels)
        setImageUrl(croppedImage)
        setShowCropModal(false)
        setTempImageUrl('')
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        message.success('Đã cắt ảnh thành công!')
      }
    } catch (e) {
      console.error(e)
      message.error('Có lỗi khi cắt ảnh!')
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setTempImageUrl('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleSubmit = async () => {
    if (!formData.hoVaTen || !formData.chucVuDonVi || !formData.loiNhan) {
      message.warning('Vui lòng điền đầy đủ thông tin!')
      return
    }
    if (!imageUrl) {
      message.warning('Vui lòng chọn ảnh!')
      return
    }
    try {
      message.loading({ content: 'Đang tạo ảnh...', key: 'download' })
      if (previewRef.current) {
        const dataUrl = await domToPng(previewRef.current, { quality: 1, scale: 6, filter: (_node) => true })
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `loi-nhan-dai-hoi-${formData.hoVaTen.replace(/\s+/g, '-')}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        message.success({ content: 'Tải ảnh thành công!', key: 'download' })
      }
    } catch (error) {
      console.error(error)
      message.error({ content: 'Có lỗi khi tải ảnh!', key: 'download' })
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 11px',
    borderRadius: 8,
    border: '1px solid rgba(59,130,246,0.3)',
    background: 'rgba(255,255,255,0.9)',
    color: '#1e3a5f',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#3b6fa0',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: '#7eafd4',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 40%, #e0f2fe 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '16px 12px',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .form-left-panel {
          width: 300px;
          min-width: 300px;
          flex-shrink: 0;
          background: rgba(239,246,255,0.9);
          border-right: 1px solid rgba(59,130,246,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .form-right-panel {
          flex: 1;
          min-width: 280px;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(241,245,249,0.5);
        }
        .preview-container {
          position: relative;
          height: 100%;
          aspect-ratio: 1/1;
          max-width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 16px 60px rgba(37,99,235,0.25);
          container-type: size;
        }
        .preview-avatar {
          position: absolute;
          top: 82.7%;
          left: 28.785%;
          width: 13%;
          aspect-ratio: 1/1;
        }
        .preview-info {
          position: absolute;
          top: 81%;
          left: 44.5%;
          width: 52%;
          bottom: 2%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          overflow: hidden;
        }
        .preview-name {
          color: #FFD700;
          font-weight: 700;
          font-size: clamp(7px, 1.8cqw, 15px);
          text-transform: uppercase;
          line-height: 1.2;
          margin: 0;
          word-break: break-word;
          white-space: normal;
        }
        .preview-chucvu {
          color: #fff;
          font-style: normal;
          font-size: clamp(8px, 1.7cqw, 18px);
          line-height: 1.35;
          margin: 0;
          word-break: break-word;
          white-space: normal;
        }
        .preview-loinhan {
          color: white;
          font-size: clamp(8px, 2.4cqw, 28px);
          line-height: 1.75;
          word-break: break-word;
          text-align: justify;
          text-align: justify;         
          margin: 0;
        }
        @media (max-width: 768px) {
          .form-left-panel {
            width: 100% !important;
            min-width: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(59,130,246,0.15);
          }
          .form-right-panel {
            min-width: 0 !important;
            width: 100% !important;
            min-height: 360px;
            padding: 16px !important;
          }
          .preview-avatar {
            top: 82.7%;
            left: 28.785%;
          }
          .preview-info {
            top: 80%;
            left: 44.5%;
          }
            .preview-loinhan {
    font-size: clamp(8px, 2.8cqw, 30px);
  }
        }
      `}</style>

      <input ref={fileInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={handleImageSelect} />

      <Modal
        title='Chỉnh sửa ảnh'
        open={showCropModal}
        onOk={handleCropConfirm}
        onCancel={handleCropCancel}
        width={600}
        okText='Xác nhận'
        cancelText='Hủy'
        centered
      >
        <div style={{ position: 'relative', height: 400, background: '#f3f4f6' }}>
          <Cropper
            image={tempImageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape='rect'
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            Zoom
          </label>
          <input
            type='range'
            value={zoom}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>

      <div style={{ textAlign: 'center', marginBottom: 12, maxWidth: 900, width: '100%' }}>
        <div
          style={{
            background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #1d4ed8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            fontSize: 'clamp(10px, 1.05vw, 13px)',
            letterSpacing: '0.06em',
            lineHeight: 1.65,
            textTransform: 'uppercase'
          }}
        >
          CHÀO MỪNG ĐẠI HỘI ĐẠI BIỂU HỘI LIÊN HIỆP THANH NIÊN VIỆT NAM TỈNH HƯNG YÊN LẦN THỨ I, NHIỆM KỲ 2026 - 2029
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '90vw',
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(37,99,235,0.15)',
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'auto',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className='form-left-panel'>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
            <div
              style={{
                fontSize: 10,
                color: '#7eafd4',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 3
              }}
            >
              Công cụ tạo nội dung
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', lineHeight: 1.3 }}>Tạo thông điệp</div>
            <div style={{ fontSize: 11, color: '#5a8ab0', marginTop: 3 }}>Điền thông tin để tạo ảnh cá nhân</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Ảnh đại biểu</div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed rgba(59,130,246,0.4)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  background: imageUrl ? 'rgba(219,234,254,0.6)' : 'rgba(255,255,255,0.5)',
                  transition: 'background 0.2s'
                }}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt='preview'
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #3b82f6',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>Đã chọn ảnh</div>
                      <div style={{ fontSize: 10, color: '#7eafd4' }}>Nhấn để đổi ảnh</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'rgba(59,130,246,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 17,
                        flexShrink: 0
                      }}
                    >
                      📷
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#3b6fa0' }}>Tải lên ảnh đại biểu</div>
                      <div style={{ fontSize: 10, color: '#7eafd4' }}>Cắt tròn tự động</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(59,130,246,0.12)', marginBottom: 14 }} />

            <div style={{ marginBottom: 4 }}>
              <div style={sectionTitleStyle}>Thông tin cá nhân</div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>
                  Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder='Nhập họ và tên...'
                  maxLength={50}
                  value={formData.hoVaTen}
                  onChange={(e) => setFormData({ ...formData, hoVaTen: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Chức vụ và đơn vị công tác <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  placeholder='Nhập chức vụ và đơn vị công tác...'
                  rows={3}
                  maxLength={200}
                  value={formData.chucVuDonVi}
                  onChange={(e) => setFormData({ ...formData, chucVuDonVi: e.target.value })}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(59,130,246,0.12)', margin: '14px 0' }} />

            <div>
              <div style={sectionTitleStyle}>Nội dung thông điệp</div>
              <label style={labelStyle}>
                Lời nhắn gửi Đại hội <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                placeholder='Viết lời nhắn, thông điệp gửi tới Đại hội...'
                rows={6}
                maxLength={500}
                value={formData.loiNhan}
                onChange={(e) => setFormData({ ...formData, loiNhan: e.target.value })}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.65 }}
              />
              <div style={{ textAlign: 'right', fontSize: 10, color: '#7eafd4', marginTop: 4 }}>
                {formData.loiNhan.length} / 500
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 18px 16px', borderTop: '1px solid rgba(59,130,246,0.12)' }}>
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              ⬇ Tải ảnh thông điệp
            </button>
          </div>
        </div>

        <div className='form-right-panel'>
          <div className='preview-container' ref={previewRef}>
            <img
              src='/assets/images/main-gui-thong-diep.jpg'
              alt='Template'
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {imageUrl && (
              <div className='preview-avatar'>
                <img
                  src={imageUrl}
                  alt='Uploaded'
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
            )}

            {(formData.hoVaTen || formData.chucVuDonVi) && (
              <div className='preview-info'>
                {formData.hoVaTen && <p className='preview-name'>{formData.hoVaTen}</p>}
                {formData.chucVuDonVi && <p className='preview-chucvu'>{formData.chucVuDonVi}</p>}
              </div>
            )}

            {formData.loiNhan && (
              <div
                style={{
                  position: 'absolute',
                  top: '46%',
                  left: '8%',
                  right: '8%',
                  bottom: '20%',
                  padding: '4px 8px',
                  overflow: 'hidden'
                }}
              >
                <p className='preview-loinhan'>{formData.loiNhan}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormDienNguoiDung
