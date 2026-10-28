# SalesDesk — Website quản lý bán hàng (bản demo)

Đây là ứng dụng web demo bằng HTML, CSS và JavaScript thuần, được thêm thành một thư mục độc lập trong fork OpenClaw. Ứng dụng không thay thế hoặc chỉnh sửa phần lõi của OpenClaw.

## Chức năng
- Trang tổng quan doanh thu, số đơn, sản phẩm và khách hàng.
- Thêm, sửa, xóa sản phẩm; theo dõi tồn kho và cảnh báo sắp hết hàng.
- Tạo đơn hàng, tính tổng tiền, cập nhật trạng thái và hoàn lại tồn kho khi hủy đơn.
- Tổng hợp khách hàng từ các đơn hàng; xuất danh sách khách hàng dạng CSV.
- Trợ lý chat mô phỏng bằng các câu trả lời mẫu.
- Lưu dữ liệu trong localStorage của trình duyệt.

## Chạy trên máy tính
1. Tải repository hoặc chỉ tải thư mục `sales-management`.
2. Mở `sales-management/index.html` trong trình duyệt, hoặc mở thư mục bằng VS Code và dùng tiện ích Live Server.
3. Không cần XAMPP, cài thư viện hay API key.

## Lưu ý
- Đây là bản giao diện demo chạy phía trình duyệt, chưa có backend, tài khoản đăng nhập, đồng bộ nhiều người dùng hay kết nối thanh toán thật.
- Trợ lý chat hiện chỉ dùng quy tắc mẫu, chưa kết nối mô hình AI/OpenClaw.
- Dữ liệu mẫu và các thay đổi được lưu trong trình duyệt đang sử dụng. Xóa dữ liệu trang web có thể làm mất dữ liệu demo.
- Trước khi dùng thực tế cần bổ sung máy chủ, cơ sở dữ liệu, xác thực người dùng, kiểm tra quyền và bảo vệ dữ liệu khách hàng.

## Giấy phép
Thư mục demo này là phần bổ sung độc lập. Repository gốc OpenClaw có giấy phép MIT; xem file `LICENSE` và `THIRD_PARTY_NOTICES.md` ở thư mục gốc để biết điều khoản áp dụng cho mã nguồn của OpenClaw và các thành phần bên thứ ba.
