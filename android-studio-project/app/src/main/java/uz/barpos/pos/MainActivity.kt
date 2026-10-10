package uz.barpos.pos

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.EditText
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import uz.barpos.pos.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences
    private var backPressedTime: Long = 0

    companion object {
        private const val PREFS_NAME = "barpos_config"
        private const val KEY_SERVER_URL = "server_url"
        // Default Cloud Server URL for BarPOS
        private const val DEFAULT_URL = "https://ais-dev-jbxo4myjqwzyyal7hzzxxj-348577159442.asia-southeast1.run.app"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Dark Status bar configuration
        WindowCompat.setDecorFitsSystemWindows(window, true)
        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        setupWebView()
        setupSwipeRefresh()
        setupOfflineControls()
        setupBackNavigation()

        loadServerUrl()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.setSupportZoom(false)
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Modern User Agent
        settings.userAgentString = settings.userAgentString + " BarPOS-Android/1.0"

        // JavaScript Native Bridge
        webView.addJavascriptInterface(WebAppInterface(this, this), "AndroidBridge")

        // ChromeClient for progress bar and web permissions
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.progressBar.progress = newProgress
                } else {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefreshLayout.isRefreshing = false
                }
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        // WebViewClient for navigation and error handling
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.offlineLayout.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                binding.swipeRefreshLayout.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    if (!isNetworkAvailable()) {
                        binding.offlineLayout.visibility = View.VISIBLE
                    }
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Keep internal app requests inside WebView
                return false
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeColors(getColor(R.color.primary))
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeColor(getColor(R.color.surface))
        binding.swipeRefreshLayout.setOnRefreshListener {
            binding.webView.reload()
        }
    }

    private fun setupOfflineControls() {
        binding.btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                binding.offlineLayout.visibility = View.GONE
                binding.webView.reload()
            } else {
                Toast.makeText(this, "Internet ulanishi mavjud emas!", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnSettingsUrl.setOnClickListener {
            showServerUrlDialog()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        finish()
                    } else {
                        Toast.makeText(this@MainActivity, "Chiqish uchun yana bir marta bosing", Toast.LENGTH_SHORT).show()
                        backPressedTime = System.currentTimeMillis()
                    }
                }
            }
        })
    }

    fun reloadCurrentPage() {
        binding.webView.reload()
    }

    private fun loadServerUrl() {
        val serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
        if (isNetworkAvailable()) {
            binding.offlineLayout.visibility = View.GONE
            binding.webView.loadUrl(serverUrl)
        } else {
            binding.offlineLayout.visibility = View.VISIBLE
        }
    }

    private fun showServerUrlDialog() {
        val currentUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
        val input = EditText(this).apply {
            setText(currentUrl)
            setSelection(currentUrl.length)
            setPadding(48, 32, 48, 32)
        }

        AlertDialog.Builder(this)
            .setTitle("Server URL Manzili")
            .setMessage("Bulutli yoki mahalliy tarmoqdagi (Wi-Fi) POS server manzilini kiriting:")
            .setView(input)
            .setPositiveButton("Saqlash") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty() && (newUrl.startsWith("http://") || newUrl.startsWith("https://"))) {
                    prefs.edit().putString(KEY_SERVER_URL, newUrl).apply()
                    binding.webView.loadUrl(newUrl)
                    Toast.makeText(this, "Server manzili yangilandi!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Noto'g'ri URL (http:// yoki https:// bilan boshlang)", Toast.LENGTH_LONG).show()
                }
            }
            .setNegativeButton("Bekor qilish", null)
            .setNeutralButton("Asl holatga") { _, _ ->
                prefs.edit().putString(KEY_SERVER_URL, DEFAULT_URL).apply()
                binding.webView.loadUrl(DEFAULT_URL)
            }
            .show()
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onDestroy() {
        binding.webView.destroy()
        super.onDestroy()
    }
}
