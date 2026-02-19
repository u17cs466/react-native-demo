import { StatusBar } from 'expo-status-bar'; // Expo status bar component
import React, { useState, useEffect } from 'react'; // React and hooks
import {
  StyleSheet, // create stylesheet
  Text, // display text
  View, // basic view container
  ScrollView, // scrollable container
  TextInput, // input field
  Button, // platform button
  TouchableOpacity, // touchable wrapper
  KeyboardAvoidingView, // moves content above keyboard
  Platform, // platform detection helper
  Alert, // native alert dialogs
} from 'react-native'; // react-native export
import AsyncStorage from '@react-native-async-storage/async-storage'; // persistent key-value storage

export default function App() { // main app component
  const [title, setTitle] = useState(''); // blog title state
  const [content, setContent] = useState(''); // blog content state
  const [blogs, setBlogs] = useState([]); // array of blog objects
  const [isLoading, setIsLoading] = useState(true); // loading indicator for storage

  function addBlog() {
    if (!title.trim() || !content.trim()) { // validate inputs
      Alert.alert('Validation', 'Please enter both a title and content for the blog.'); // show alert
      return; // stop if invalid
    }

    const newBlog = { // create new blog object
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(), // unique id
      title: title.trim(), // trimmed title
      content: content.trim(), // trimmed content
      expanded: false, // collapsed by default
    };
    setBlogs(prev => [newBlog, ...prev]); // prepend to blogs
    setTitle(''); // clear title input
    setContent(''); // clear content input
  }

  // Load saved blogs from AsyncStorage on mount
  useEffect(() => { // load persisted blogs once on mount
    let mounted = true; // track mounted state
    async function load() { // async loader
      try {
        const raw = await AsyncStorage.getItem('@blogs'); // read from storage
        if (raw) {
          const parsed = JSON.parse(raw); // parse saved JSON
          if (mounted && Array.isArray(parsed)) setBlogs(parsed); // restore if valid
        }
      } catch (e) {
        console.warn('Failed to load blogs from storage', e); // log load errors
      } finally {
        if (mounted) setIsLoading(false); // clear loading flag
      }
    }
    load(); // invoke loader
    return () => {
      mounted = false; // cleanup on unmount
    };
  }, []); // empty deps => run once

  // Persist blogs whenever they change (skip initial load)
  useEffect(() => { // persist blogs when they change (after initial load)
    if (isLoading) return; // skip while loading initial data
    async function save() { // async saver
      try {
        await AsyncStorage.setItem('@blogs', JSON.stringify(blogs)); // write JSON to storage
      } catch (e) {
        console.warn('Failed to save blogs to storage', e); // log save errors
      }
    }
    save(); // invoke save
  }, [blogs, isLoading]); // run when blogs or loading state changes

  function toggleExpand(id) {
    setBlogs(prev => prev.map(b => (b.id === id ? { ...b, expanded: !b.expanded } : b))); // toggle expanded flag
  }

  function deleteBlog(id) {
    // On web, Alert.alert does not support button callbacks reliably, use window.confirm
    if (Platform.OS === 'web') {
      const ok = typeof confirm === 'function' ? confirm('Are you sure you want to delete this blog?') : true;
      if (ok) setBlogs(prev => prev.filter(b => b.id !== id));
      return;
    }

    // On native platforms, use a native alert with buttons
    Alert.alert('Delete blog', 'Are you sure you want to delete this blog?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setBlogs(prev => prev.filter(b => b.id !== id)) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container} // main container style
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // keyboard behavior per platform
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Blog Writer</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title} // bind title value
            onChangeText={setTitle} // update title on change
            placeholder="Enter blog title" // placeholder text
            style={styles.input} // input styling
          />

          <Text style={styles.label}>Content</Text>
          <TextInput
            value={content} // bind content value
            onChangeText={setContent} // update content on change
            placeholder="Write your blog content here" // placeholder text
            style={[styles.input, styles.textArea]} // text area styling
            multiline // allow multiple lines
            numberOfLines={6} // suggested lines
          />

          <View style={styles.buttonRow}>
            <Button title="Add Blog" onPress={addBlog} />
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.subHeader}>Your Blogs</Text>
          {blogs.length === 0 ? (
            <Text style={styles.empty}>No blogs yet — write your first one above.</Text>
          ) : (
            blogs.map(blog => (
              <View key={blog.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{blog.title}</Text>
                </View>
                <Text style={styles.cardContent}>
                  {blog.expanded ? blog.content : blog.content.slice(0, 140) + (blog.content.length > 140 ? '…' : '')}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => toggleExpand(blog.id)} style={styles.actionButton}>
                    <Text style={styles.actionText}>{blog.expanded ? 'Hide' : 'View'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteBlog(blog.id)} style={[styles.actionButton, styles.deleteButton]}>
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    alignItems: 'flex-start',
  },
  listContainer: {
    marginBottom: 40,
  },
  empty: {
    color: '#666',
    fontStyle: 'italic',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    fontSize: 14,
    color: '#222',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#eef',
    marginRight: 8,
  },
  actionText: {
    color: '#0645AD',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee',
  },
  deleteText: {
    color: '#a00',
  },
});
