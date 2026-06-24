#![allow(non_snake_case)]
#![allow(nonstandard_style)]

use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use windows::Win32::Devices::Bluetooth::{
    BluetoothFindDeviceClose, BluetoothFindFirstDevice, BluetoothFindNextDevice,
    BLUETOOTH_DEVICE_SEARCH_PARAMS, BLUETOOTH_DEVICE_INFO,
};
use windows::Win32::Foundation::BOOL;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDevice {
    pub name: String,
    pub address: String,
}

pub fn get_paired_bluetooth_devices() -> Result<Vec<BluetoothDevice>, String> {
    #[cfg(windows)]
    {
        scan_paired_bluetooth_devices()
    }

    #[cfg(not(windows))]
    {
        Err("当前仅实现 Windows 蓝牙环境扫描".to_string())
    }
}

#[cfg(windows)]
fn scan_paired_bluetooth_devices() -> Result<Vec<BluetoothDevice>, String> {
    let mut devices: Vec<BluetoothDevice> = Vec::new();
    let mut seen_addresses: HashSet<String> = HashSet::new();

    unsafe {
    let mut params: BLUETOOTH_DEVICE_SEARCH_PARAMS = std::mem::zeroed();
    params.dwSize = std::mem::size_of::<BLUETOOTH_DEVICE_SEARCH_PARAMS>() as u32;
    // 仅获取已配对/已记住的设备，用于设备指纹标识
    params.fReturnAuthenticated = BOOL(1);
    params.fReturnRemembered = BOOL(1);
    params.fReturnConnected = BOOL(1);
    params.fReturnUnknown = BOOL(0);
    params.cTimeoutMultiplier = 0;

        let mut info: BLUETOOTH_DEVICE_INFO = std::mem::zeroed();
        info.dwSize = std::mem::size_of::<BLUETOOTH_DEVICE_INFO>() as u32;

        let h_find = BluetoothFindFirstDevice(&params, &mut info)
            .map_err(|e| format!("BluetoothFindFirstDevice 失败: {}", e))?;

        loop {
            if let Some(device) = parse_device(&info) {
                if !seen_addresses.contains(&device.address) {
                    seen_addresses.insert(device.address.clone());
                    devices.push(device);
                }
            }

            if BluetoothFindNextDevice(h_find, &mut info).is_err() {
                break;
            }
        }

        let _ = BluetoothFindDeviceClose(h_find);
    }

    info!(
        "[BluetoothEnvironment] 已配对蓝牙设备 (共 {} 个): {:?}",
        devices.len(),
        devices
    );
    Ok(devices)
}

#[cfg(windows)]
fn parse_device(info: &BLUETOOTH_DEVICE_INFO) -> Option<BluetoothDevice> {
    let name = pwstr_to_string(info.szName.as_ptr());

    if name.is_empty() {
        return None;
    }

    let addr = unsafe { &info.Address.Anonymous.rgBytes };
    let address = format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", addr[5], addr[4], addr[3], addr[2], addr[1], addr[0]);

    Some(BluetoothDevice { name, address })
}

/// Helper to convert a null-terminated wide string slice to String
#[cfg(windows)]
fn pwstr_to_string(ptr: *const u16) -> String {
    if ptr.is_null() {
        return String::new();
    }
    unsafe {
        let len = (0..).take_while(|&i| *ptr.add(i) != 0).count();
        String::from_utf16_lossy(std::slice::from_raw_parts(ptr, len))
    }
}
