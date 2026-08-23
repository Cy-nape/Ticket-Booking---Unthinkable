import qrcode
import base64
import io

def generate_qr_code(booking_id: str) -> str:
    """
    Generates a QR code containing a booking verification URI.
    Returns the image as a base64 encoded string.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    # The payload encoded into the QR code
    payload = f"ticketbooking://booking/verify?id={booking_id}"
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return img_str
