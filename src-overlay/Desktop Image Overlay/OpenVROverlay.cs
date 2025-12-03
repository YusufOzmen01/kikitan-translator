using OVRSharp;
using Valve.VR;
using Application = OVRSharp.Application;

namespace Desktop_Image_Overlay;

public class ImageData
{
    public MemoryStream image;
    public int time;
}

public class OpenVROverlay : Application
{
    private Overlay overlay;
    private List<ImageData> images;

    private float overlayDistance = -1.5f;
    private float verticalOffset = -0.3f;

    public OpenVROverlay() : base(ApplicationType.Overlay)
    {
        Console.WriteLine("Starting overlay...");

        overlay = new Overlay("kikitan-overlay", "Kikitan Overlay");

        overlay.WidthInMeters = 1f;
        overlay.Alpha = 1.0f;
        overlay.SetFlag(VROverlayFlags.IsPremultiplied, false);
        overlay.SetFlag(VROverlayFlags.SendVRSmoothScrollEvents, false);

        images = new List<ImageData>();
    }

    private void UpdateOverlayTransforms()
    {
        var system = OpenVR.System;
        if (system == null)
        {
            Console.WriteLine("OpenVR system not initialized.");
            return;
        }

        var leftEye = system.GetEyeToHeadTransform(EVREye.Eye_Left);

        HmdMatrix34_t overlayTransform = new HmdMatrix34_t
        {
            m0 = 1, m1 = 0, m2 = 0, m3 = leftX,
            m4 = 0, m5 = 1, m6 = 0, m7 = verticalOffset,
            m8 = 0, m9 = 0, m10 = 1, m11 = overlayDistance
        };

        var err = OpenVR.Overlay.SetOverlayTransformTrackedDeviceRelative(
            overlay.Handle, OpenVR.k_unTrackedDeviceIndex_Hmd, ref overlayTransform);

        if (err != EVROverlayError.None)
        {
            Console.WriteLine($"Overlay transform error: {err}");
        }
    }

    public void AddToQueue(MemoryStream data, int time)
    {
        images.Add(new ImageData { image = data, time = time });
    }

    public void ImageLoop()
    {
        while (true)
        {
            if (images.Count == 0)
            {
                Thread.Sleep(10);
                continue;
            }

            UpdateOverlayTransforms();

            string fileName = Path.Combine(Path.GetTempPath(), "kikitan_overlay.png");
            Console.WriteLine("Saving overlay as file...");

            using (Image image = Image.FromStream(images[0].image))
            {
                image.Save(fileName);
            }

            overlay.Show();
            overlay.SetTextureFromFile(fileName);

            Thread.Sleep(images[0].time);

            if (images.Count == 1)
                images.Clear();
            else
                images.RemoveAt(0);

            Console.WriteLine("Hiding overlay...");
            overlay.Hide();
        }
    }
}