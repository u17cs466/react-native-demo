import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Button,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './src/store/store';
import { setBlogs, addBlog as addBlogAction, deleteBlog as deleteBlogAction, toggleExpand as toggleExpandAction } from './src/store/blogsSlice';

function AppInner() {
  const dispatch = useDispatch();
  const blogs = useSelector(state => state.blogs.items);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function addBlog() {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Please enter both a title and content for the blog.');
      return;
    }
    const newBlog = {
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      title: title.trim(),
      content: content.trim(),
      expanded: false,
    };
    dispatch(addBlogAction(newBlog));
    setTitle('');
    setContent('');
  }

  function onToggle(id) {
    dispatch(toggleExpandAction(id));
  }

  function onDelete(id) {
    if (Platform.OS === 'web') {
      const ok = typeof confirm === 'function' ? confirm('Are you sure you want to delete this blog?') : true;
      if (ok) dispatch(deleteBlogAction(id));
      return;
    }
    Alert.alert('Delete blog', 'Are you sure you want to delete this blog?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteBlogAction(id)) },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Blog Writer</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Enter blog title" style={styles.input} />

          <Text style={styles.label}>Content</Text>
          <TextInput value={content} onChangeText={setContent} placeholder="Write your blog content here" style={[styles.input, styles.textArea]} multiline numberOfLines={6} />

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
                <Text style={styles.cardContent}>{blog.expanded ? blog.content : blog.content.slice(0, 140) + (blog.content.length > 140 ? '…' : '')}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => onToggle(blog.id)} style={styles.actionButton}>
                    <Text style={styles.actionText}>{blog.expanded ? 'Hide' : 'View'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(blog.id)} style={[styles.actionButton, styles.deleteButton]}>
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

export default function App() {
  // Load persisted blogs once into store and subscribe to persist changes
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem('@blogs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted && Array.isArray(parsed)) store.dispatch(setBlogs(parsed));
        }
      } catch (e) {
        console.warn('Failed to load blogs from storage', e);
      }
    }
    load();

    // subscribe and persist on change
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      try {
        AsyncStorage.setItem('@blogs', JSON.stringify(state.blogs.items));
      } catch (e) {
        console.warn('Failed to save blogs', e);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
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
